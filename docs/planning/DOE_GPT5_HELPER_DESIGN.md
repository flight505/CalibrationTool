# GPT-5 Responses Helper Design (DOE Workbench)

_Last updated: 2025-10-03_

## Goals
- Centralize all OpenAI Responses API usage for the DOE workbench in one TypeScript helper.
- Support both synchronous (batched) and streaming workflows for Phase 1 (spec retrieval & factor plan) and Phase 2 (Taguchi analysis) calls.
- Enforce structured JSON outputs via OpenAI's `text.format.json_schema` support with strict validation.
- Surface web-search citations and reasoning summaries in the UI without reimplementing parsing logic in each component.

## Module layout
- **File:** `src/lib/utils/openai.ts`
  - Retains embedding + cosine similarity helpers.
  - Adds a singleton `responsesClient` accessor wrapping `new OpenAI()` to avoid multiple instantiations.
  - Exports DOE-specific call helpers and shared parsing utilities.
- **New types:** added under `src/utils/doe/doeTypes.ts` for strongly typed LLM payloads (input + output schemas) where missing.
- **Possible future split:** if generic usage grows, migrate DOE-specific logic to `src/utils/doe/llm.ts`.

## API surface
```ts
export interface Phase1Request {
  form: Phase1FormInput;              // Derived from DOEWorkbench selections
  userObjectives: string[];
  knownIssues?: string;
  stream?: boolean;
}

export interface Phase2Request {
  scoredRuns: ExperimentRun[];
  mainEffects?: MainEffectAnalysis[]; // optional context to seed LLM
  stream?: boolean;
}

export interface StreamHandlers {
  onEvent?: (event: ResponsesEvent) => void; // raw SSE envelope
  onTextDelta?: (delta: string) => void;
  onWebSearchStatus?: (status: 'in_progress' | 'searching' | 'completed') => void;
  onComplete?: (payload: Phase1Result | Phase2Result) => void;
  onError?: (error: Error) => void;
}
```

Core helpers:
1. `buildPhase1Schema(form: Phase1FormInput): JsonSchema` – returns deterministic schema for ranges, orthogonal array, citations, etc.
2. `buildPhase2Schema(): JsonSchema` – schema for Taguchi analysis summary and OrcaSlicer table.
3. `createPhase1Request(params: Phase1Request)` – constructs `Responses.CreateParams` payload, including:
   - `model: 'gpt-5'` (with optional override/fallback to `'gpt-5-mini'`).
   - `instructions` based on `docs/LLM_ASSISTED_DOE_REVISED.md` Phase 1 system prompt.
   - `input` array with structured user context.
   - `tools`: `[{ type: 'web_search', search_context_size: 'medium', user_location: { type: 'approximate', approximate: { country: 'US' } } }]` with optional domain filters.
   - `include: ['web_search_call.action.sources']` for citations.
   - `reasoning: { effort: 'medium', summary: 'concise' }`.
   - `text.format` referencing schema.
4. `createPhase2Request(params: Phase2Request)` – similar but without web search, `reasoning.effort: 'high'`, `tool_choice: 'none'`.
5. `invokeResponses(params, handlers?)` – shared executor that decides between streaming vs. non-streaming. For streaming:
   - Uses `client.responses.create({ ... , stream: true })` and `for await` loop to route events via handlers.
   - Parses final `response.completed` payload to JSON and emits through `onComplete`.
   - Supplies SSE type guards for `response.web_search_call.*`, `response.output_text.delta`, etc.
   For non-streaming: returns parsed JSON result directly.

## Structured JSON contracts
### Phase 1 Output
```json
{
  "selected_array": "L9",
  "factor_plans": [
    {
      "parameter": "nozzle_temperature",
      "levels": [205, 215, 225],
      "unit": "celsius",
      "rationale": "Based on manufacturer spec 200-230°C",
      "citations": ["https://example.com/datasheet"]
    }
  ],
  "test_parts": ["calibration_cube", "bridge_array_v2"],
  "print_instructions": "Prioritize surface quality",
  "source_summary": [
    { "title": "Prusament PLA Datasheet", "url": "...", "snippet": "..." }
  ]
}
```

### Phase 2 Output
```json
{
  "optimal_levels": {
    "nozzle_temperature": 215,
    "print_speed": 55,
    "flow_ratio": 1.02
  },
  "snr": [
    { "factor": "nozzle_temperature", "delta": 4.5 }
  ],
  "main_effects": [
    { "factor": "print_speed", "trend": [1.2, 0.8, -0.3] }
  ],
  "confirmation_run": {
    "recommended": true,
    "settings": { "temperature": 215, "speed": 55 },
    "expected_quality_gain": 0.18
  },
  "notes": "Interpolate between level 2 and 3 for layer adhesion"
}
```

Schemas will be assembled with Zod for local validation and mirrored in JSON Schema for the API request.

## Error handling
- Convert OpenAI SDK errors to `DOECallError` objects with `code`, `message`, `requestId`.
- Distinguish schema validation failures vs. transport errors.
- Provide helper `isSchemaViolation(error)` to direct UI prompts.

## Streaming integration
- We'll add a lightweight event parser under `src/lib/utils/openaiResponses.ts` (internal) that:
  - Maps `ResponseEvent` discriminated unions to typed callbacks.
  - Aggregates `output_text.delta` segments into a buffer (for prototypes) but primarily relies on structured JSON final result.
- DOEWorkbench will consume via hook `useLLMStream` (to be added later) but helper exposes `async function*` to keep options open.

## Next steps
1. Implement helpers + types.
2. Wire DOEWorkbench to use Phase 1 helper for “Propose Ranges”.
3. Wire Phase 2 analysis flow to call new helper and store reasoning artifacts.
4. Add Jest/Vitest fixtures with mock SSE transcripts.

## Implementation status (2025-10-03)
- `src/lib/utils/openai.ts` now exposes `callPhase1LLM` and `callPhase2LLM`, including streaming hooks and JSON schema enforcement.
- JSON schemas + Zod validation live in `src/utils/doe/llmSchemas.ts`.
- System prompts extracted to `src/utils/doe/llmPrompts.ts` for reuse.
