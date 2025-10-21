import OpenAI, { APIError } from 'openai';
import type {
  Response,
  ResponseCreateParamsBase,
  ResponseCreateParamsNonStreaming,
  ResponseCreateParamsStreaming,
  ResponseStreamEvent,
  Tool,
  WebSearchTool
} from 'openai/resources/responses/responses';
import type { Stream } from 'openai/streaming';

import {
  phase1JsonSchema,
  phase2JsonSchema,
  validatePhase1Result,
  validatePhase2Result
} from '../../utils/doe/llmSchemas';
import {
  Phase1LLMResult,
  Phase1RequestPayload,
  Phase2LLMResult,
  Phase2RequestPayload
} from '../../utils/doe/doeTypes';
import { PHASE1_SYSTEM_PROMPT, PHASE2_SYSTEM_PROMPT } from '../../utils/doe/llmPrompts';
import type { DOEStreamHandlers, DOECallError } from './doeLLMCommon';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not defined. Set the server environment variable before using GPT features.');
}

export const openai = new OpenAI({
  apiKey
});

export interface ApproximateLocation {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

export interface Phase1LLMOptions {
  payload: Phase1RequestPayload;
  stream?: boolean;
  model?: string;
  location?: ApproximateLocation;
  handlers?: DOEStreamHandlers<Phase1LLMResult>;
}

export interface Phase2LLMOptions {
  payload: Phase2RequestPayload;
  stream?: boolean;
  model?: string;
  handlers?: DOEStreamHandlers<Phase2LLMResult>;
}

export async function callPhase1LLM(options: Phase1LLMOptions): Promise<Phase1LLMResult> {
  const request = buildPhase1Request(options);
  return executeDOECall<Phase1LLMResult>(request, validatePhase1Result, options.handlers);
}

export async function callPhase2LLM(options: Phase2LLMOptions): Promise<Phase2LLMResult> {
  const request = buildPhase2Request(options);
  return executeDOECall<Phase2LLMResult>(request, validatePhase2Result, options.handlers);
}

function buildPhase1Request(options: Phase1LLMOptions): ResponseCreateParamsBase {
  const {
    model,
    location,
    stream
  } = options;

  const tool: Tool = {
    type: 'web_search_preview',
    search_context_size: 'medium'
  };

  if (location && Object.keys(location).length) {
    (tool as WebSearchTool).user_location = {
      type: 'approximate',
      country: location.country ?? null,
      region: location.region ?? null,
      city: location.city ?? null,
      timezone: location.timezone ?? null
    };
  }

  return {
    model: model ?? 'gpt-5',
    instructions: PHASE1_SYSTEM_PROMPT,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildPhase1UserContext(options)
          }
        ]
      }
    ],
    tools: [tool],
    reasoning: { effort: 'medium', summary: 'concise' },
    text: {
      format: {
        type: 'json_schema',
        name: 'doe_phase1_spec',
        schema: phase1JsonSchema,
        strict: true
      }
    },
    max_output_tokens: 2048,
    stream: stream ?? false
  } satisfies ResponseCreateParamsBase;
}

function buildPhase2Request(options: Phase2LLMOptions): ResponseCreateParamsBase {
  const { payload, model, stream } = options;

  return {
    model: model ?? 'gpt-5',
    instructions: PHASE2_SYSTEM_PROMPT,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildPhase2UserContext(payload)
          }
        ]
      }
    ],
    reasoning: { effort: 'high', summary: 'concise' },
    tool_choice: 'none',
    text: {
      format: {
        type: 'json_schema',
        name: 'doe_phase2_analysis',
        schema: phase2JsonSchema,
        strict: true
      }
    },
    max_output_tokens: 2048,
    stream: stream ?? false
  } satisfies ResponseCreateParamsBase;
}

async function executeDOECall<T>(
  params: ResponseCreateParamsBase,
  validator: (payload: unknown) => T,
  handlers?: DOEStreamHandlers<T>
): Promise<T> {
  const useStream = params.stream === true;

  try {
    if (useStream) {
      const stream = (await openai.responses.create(
        params as ResponseCreateParamsStreaming
      )) as Stream<ResponseStreamEvent>;

      let completedResponse: Response | null = null;

      for await (const event of stream) {
        handlers?.onEvent?.(event);

        switch (event.type) {
          case 'response.web_search_call.in_progress':
            handlers?.onWebSearchStatus?.('in_progress');
            break;
          case 'response.web_search_call.searching':
            handlers?.onWebSearchStatus?.('searching');
            break;
          case 'response.web_search_call.completed':
            handlers?.onWebSearchStatus?.('completed');
            break;
          case 'response.output_text.delta':
            handlers?.onTextDelta?.(event.delta);
            break;
          case 'response.completed':
            completedResponse = event.response;
            break;
          case 'response.failed': {
            const failure = buildResponseFailure(event.response.error ?? null);
            handlers?.onError?.(failure);
            throw failure;
          }
          case 'error': {
            const generic = normaliseError(new Error(event.message ?? 'Response stream error.'));
            handlers?.onError?.(generic);
            throw generic;
          }
          default:
            break;
        }
      }

      if (!completedResponse) {
        throw new Error('Stream completed without a final response payload.');
      }

      const payload = extractResponseJson(completedResponse);
      const parsed = validator(payload);
      handlers?.onCompleted?.(parsed);
      return parsed;
    }

    const response = (await openai.responses.create(
      params as ResponseCreateParamsNonStreaming
    )) as Response;

    if (response.error) {
      const failure = buildResponseFailure(response.error);
      handlers?.onError?.(failure);
      throw failure;
    }

    const payload = extractResponseJson(response);
    const parsed = validator(payload);
    handlers?.onCompleted?.(parsed);
    return parsed;
  } catch (error) {
    const normalised = normaliseError(error);
    handlers?.onError?.(normalised);
    throw normalised;
  }
}

function extractResponseJson(response: Response): unknown {
  if (typeof response.output_text === 'string' && response.output_text.trim().length > 0) {
    return parseJsonOrThrow(response.output_text);
  }

  for (const item of response.output ?? []) {
    if (item && (item as any).type === 'message') {
      const message = item as { content: Array<any> };
      for (const part of message.content ?? []) {
        if (!part) continue;
        if (typeof part.parsed !== 'undefined' && part.parsed !== null) {
          return part.parsed as unknown;
        }
        if (part.type === 'output_text' && typeof part.text === 'string') {
          return parseJsonOrThrow(part.text);
        }
      }
    }
  }

  throw new Error('No structured content returned by model.');
}

function parseJsonOrThrow(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed.length) {
    throw new Error('Model returned empty output.');
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`Failed to parse model JSON: ${(error as Error).message}`);
  }
}

function buildResponseFailure(error: Response['error'] | null): DOECallError {
  if (!error) {
    return normaliseError(new Error('Model response failed with no error message.'));
  }

  const failure: DOECallError = Object.assign(new Error(error.message), {
    name: 'DOECallError',
    code: error.code,
    status: undefined,
    requestId: undefined
  });

  return failure;
}

function normaliseError(error: unknown): DOECallError {
  if ((error as DOECallError)?.name === 'DOECallError') {
    return error as DOECallError;
  }

  if (error instanceof APIError) {
    const err: DOECallError = Object.assign(new Error(error.message), {
      name: 'DOECallError',
      code: error.code ?? undefined,
      status: error.status,
      requestId: error.requestID ?? undefined,
      cause: error
    });
    return err;
  }

  if (error instanceof Error) {
    const err: DOECallError = Object.assign(new Error(error.message), {
      name: 'DOECallError',
      cause: error
    });
    return err;
  }

  return Object.assign(new Error('Unknown error'), {
    name: 'DOECallError',
    cause: error
  }) as DOECallError;
}

function buildPhase1UserContext(options: Phase1LLMOptions): string {
  const { payload } = options;
  const { form, objectives, knownIssues } = payload;

  const structured = {
    phase: 'context_gathering',
    filament: {
      brand: form.filamentBrand,
      material: form.materialType
    },
    printer: {
      model: form.printerModel,
      architecture: form.printerType,
      nozzleDiameterMm: form.nozzleDiameter,
      targetLayerHeightMm: form.targetLayerHeight,
      enclosure: form.enclosure ?? false
    },
    objectives,
    knownIssues: knownIssues ?? form.knownIssues ?? null,
    printObjectives: form.printObjectives ?? []
  };

  return JSON.stringify(structured, null, 2);
}

function buildPhase2UserContext(payload: Phase2RequestPayload): string {
  const structured = {
    phase: 'results_analysis',
    experiment: {
      name: payload.experimentName,
      arrayType: payload.arrayType,
      testModel: payload.testModel,
      primaryMetricId: payload.primaryMetricId ?? null
    },
    factors: payload.factors,
    runs: payload.runs
  };

  return JSON.stringify(structured, null, 2);
}

// Generate embeddings for text
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

// Extract key phrases from text for entity extraction
export async function extractKeyPhrases(text: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Extract key phrases and entities related to 3D printing from the text. Return as a simple comma-separated list.'
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.1,
    max_tokens: 100,
  });
  
  const content = response.choices[0].message.content || '';
  return content.split(',').map(phrase => phrase.trim()).filter(Boolean);
}
