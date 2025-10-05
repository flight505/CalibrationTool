import type {
  Phase1LLMResult,
  Phase1RequestPayload,
  Phase2LLMResult,
  Phase2RequestPayload
} from '@/utils/doe/doeTypes';
import type { DOEStreamHandlers, DOECallError, WebSearchStatus } from '@/lib/utils/doeLLMCommon';

interface Phase1ClientOptions {
  payload: Phase1RequestPayload;
  handlers?: DOEStreamHandlers<Phase1LLMResult>;
}

interface Phase2ClientOptions {
  payload: Phase2RequestPayload;
  handlers?: DOEStreamHandlers<Phase2LLMResult>;
}

interface SSEMessage<T> {
  kind: 'event' | 'status' | 'delta' | 'completed' | 'error';
  event?: unknown;
  status?: WebSearchStatus;
  delta?: string;
  result?: T;
  error?: { message: string; code?: string; requestId?: string };
}

async function readSSE<T>(
  response: Response,
  handlers: DOEStreamHandlers<T> | undefined
): Promise<T> {
  if (!response.body) {
    throw new Error('No response body received from server.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let completed: T | null = null;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let next = extractNextChunk(buffer);
      while (next) {
        const { chunk, rest } = next;
        buffer = rest;

        if (!chunk.startsWith('data:')) {
          next = extractNextChunk(buffer);
          continue;
        }

        const payload = chunk.slice(5).trim();
        if (!payload) continue;

        const message = JSON.parse(payload) as SSEMessage<T>;

        switch (message.kind) {
          case 'status':
            if (message.status) {
              handlers?.onWebSearchStatus?.(message.status);
            }
            break;
          case 'delta':
            if (message.delta) {
              handlers?.onTextDelta?.(message.delta);
            }
            break;
          case 'event':
            handlers?.onEvent?.(message.event);
            break;
          case 'completed':
            if (message.result) {
              handlers?.onCompleted?.(message.result);
              completed = message.result;
            }
            break;
          case 'error': {
            const error: DOECallError = Object.assign(new Error(message.error?.message ?? 'LLM error'), {
              name: 'DOECallError',
              code: message.error?.code,
              requestId: message.error?.requestId
            });
            handlers?.onError?.(error);
            throw error;
          }
          default:
            break;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

 if (completed) {
    return completed;
  }

  throw new Error('LLM response completed without a final payload.');
}

function extractNextChunk(buffer: string): { chunk: string; rest: string } | null {
  const lfIndex = buffer.indexOf('\n\n');
  const crlfIndex = buffer.indexOf('\r\n\r\n');

  if (lfIndex === -1 && crlfIndex === -1) {
    return null;
  }

  if (crlfIndex !== -1 && (lfIndex === -1 || crlfIndex < lfIndex)) {
    const chunk = buffer.slice(0, crlfIndex).trim();
    const rest = buffer.slice(crlfIndex + 4);
    return { chunk, rest };
  }

  const chunk = buffer.slice(0, lfIndex).trim();
  const rest = buffer.slice(lfIndex + 2);
  return { chunk, rest };
}

export async function callPhase1LLM(options: Phase1ClientOptions): Promise<Phase1LLMResult> {
  const response = await fetch('/api/doe-phase1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ payload: options.payload })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Phase 1 request failed: ${message || response.statusText}`);
  }

  return readSSE<Phase1LLMResult>(response, options.handlers);
}

export async function callPhase2LLM(options: Phase2ClientOptions): Promise<Phase2LLMResult> {
  const response = await fetch('/api/doe-phase2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ payload: options.payload })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Phase 2 request failed: ${message || response.statusText}`);
  }

  return readSSE<Phase2LLMResult>(response, options.handlers);
}
