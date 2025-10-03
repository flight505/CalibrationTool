# OpenAI GPT-5 Responses API Notes (Spec snapshot 2025-08)

_Source: [OpenAI documented OpenAPI 2.3.0](https://app.stainless.com/api/spec/documented/openai/openapi.documented.yml) fetched locally on 2025-10-03._

## Supported GPT-5 models
- `gpt-5`, `gpt-5-mini`, `gpt-5-nano`
- Snapshot builds: `gpt-5-2025-08-07`, `gpt-5-mini-2025-08-07`, `gpt-5-nano-2025-08-07`
- Structured chat alias: `gpt-5-chat-latest`

All GPT-5 variants are available through the **Responses API** (`POST https://api.openai.com/v1/responses`). `gpt-5` and snapshot builds support reasoning configuration, web search, JSON schema enforcement, and streaming.

## Core request shape (`responses.create`)
```jsonc
{
  "model": "gpt-5",
  "instructions": "System / developer message",
  "input": [
    { "role": "user", "content": [{ "type": "input_text", "text": "..." }] }
  ],
  "tools": [ ... ],
  "tool_choice": "auto",           // or object to force a tool
  "reasoning": { "effort": "medium", "summary": "concise" },
  "background": false,              // run in background queue if true
  "max_output_tokens": 2048,
  "max_tool_calls": 8,
  "parallel_tool_calls": true,
  "store": true,                    // persist to the project conversation store
  "conversation": "conv_...",      // or {"conversation_id":..., ...}
  "include": ["web_search_call.action.sources"],
  "text": {
    "format": {
      "type": "json_schema",
      "name": "doe_phase1_spec",
      "schema": { "type": "object", "properties": { ... }, "required": [ ... ] },
      "strict": true
    },
    "verbosity": "medium"
  },
  "stream": true,
  "stream_options": { "include_obfuscation": true }
}
```

Key fields exposed by the spec:
- `instructions`: replaces chat-style system prompts.
- `input`: accepts text blocks or richer `InputItem` arrays (images, files, references).
- `tools`: array of built-ins (`web_search`, `file_search`, `code_interpreter`, `image_gen`, MCP connectors, custom `function` definitions, etc.).
- `tool_choice`: discriminator with `auto`, `none`, or explicit tool enforcement (`{ "type": "function", "name": "..." }`, `{ "type": "web_search", ... }`, etc.).
- `reasoning`: available on GPT-5 and o-series models; `effort` values `minimal | low | medium | high`; `summary` can request `auto`, `concise`, or `detailed` reasoning recaps.
- `background`: offloads to asynchronous processing when true.
- `max_output_tokens` / `max_tool_calls`: hard caps for completion length and tool invocations.
- `include`: opt-in to additional payloads such as `web_search_call.action.sources`, `message.output_text.logprobs`, or encrypted reasoning artifacts.
- `text.format`: defaults to `{ "type": "text" }`; switch to `json_schema` for structured DOE outputs or `json_object` for legacy JSON mode.
- `store`: determines whether responses are saved to the project conversation store (required for conversation hand-off).
- `conversation`: supply a conversation id/object to get stateless requests prepended with recent context automatically.
- `stream`: toggles Server-Sent Events; pair with `stream_options.include_obfuscation` if needed for side-channel mitigation.

## Web search tool integration
The spec exposes two web-search tool shapes:

| Tool type | Usage | Notes |
|-----------|-------|-------|
| `web_search` | Stable GA tool (`type` enum `web_search` or `web_search_2025_08_26`) | Supports `filters.allowed_domains`, `user_location` (`approximate` city/region/timezone), and `search_context_size` (`low | medium | high`). |
| `web_search_preview` | Latest preview tool (`type` enum `web_search_preview`, `web_search_preview_2025_03_11`) | Slightly simpler options: `search_context_size`, optional `user_location`. |

Add at least one of the above to the `tools` array. When `include` contains `"web_search_call.action.sources"`, completed tool call outputs include an array of cited URLs per action.

During streaming, web search involves dedicated SSE events:
- `response.web_search_call.in_progress`
- `response.web_search_call.searching`
- `response.web_search_call.completed`

Each event carries `item_id`, `output_index`, and `sequence_number` so the UI can surface progress indicators alongside assistant tokens.

`WebSearchToolCall.action` varies by how the model used the browser:
- `search` → includes the query and optional list of source URLs.
- `open_page` → captures a page visit with its URL.
- `find` → includes the URL and pattern searched inside the page.

## Streaming lifecycle (SSE)
When `stream: true`, Responses API emits a deterministic series of events:
1. `response.created`
2. `response.in_progress`
3. Tool lifecycle events (e.g., `response.web_search_call.*`, `response.function_call.*`)
4. Content events per output item:
   - `response.output_item.added`
   - `response.content_part.added`
   - `response.output_text.delta` / `response.output_text.done`
   - `response.content_part.done`
   - `response.output_item.done`
5. Terminal events: `response.completed` (or `response.failed`).

Consume as SSE by keeping the HTTPS request open; each `data:` line contains a JSON envelope matching the event schemas documented in the spec (`OutputItem`, `Message`, `WebSearchToolCall`, etc.).

## Structured outputs
To enforce deterministic DOE payloads, configure:
```jsonc
"text": {
  "format": {
    "type": "json_schema",
    "name": "phase2_taguchi_analysis",
    "description": "LLM analysis payload for DOE workbench",
    "strict": true,
    "schema": {
      "type": "object",
      "properties": {
        "selected_array": { "enum": ["L9", "L18", "L27"] },
        "factors": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "levels": { "type": "array", "items": { "type": "number" }, "minItems": 3, "maxItems": 3 },
              "rationale": { "type": "string" }
            },
            "required": ["name", "levels", "rationale"]
          }
        },
        "citations": {
          "type": "array",
          "items": { "type": "string", "format": "uri" }
        }
      },
      "required": ["selected_array", "factors"]
    }
  }
}
```
`strict: true` forces GPT-5 to return a schema-compliant object; invalid generations trigger a server-side error instead of partial completion.

## Implementation implications for CalibrationTool DOE
1. **Client wrapper**
   - Update `src/lib/utils/openai.ts` to construct a single OpenAI client and expose `responses.create` helpers for DOE phases.
   - Provide typed helpers for streaming (EventSource) and batched (REST) invocations.

2. **Phase 1 (Spec retrieval & factor selection)**
   - Use `model: "gpt-5"` default with fallback to `gpt-5-mini`.
   - Add `tools: [{ "type": "web_search" }]` with `filters.allowed_domains` when the user supplies vendor constraints.
   - Set `include` to `web_search_call.action.sources` so citations can be surfaced alongside recommended parameter ranges.
   - Wrap outputs in JSON schema enforcing ranges, orthogonal array choice, and supporting metadata (source URLs, confidence).

3. **Phase 2 (Taguchi analysis & interpolation)**
   - Reuse conversation history (persist response IDs via `store: true` or pass `conversation` id) so the model can reference Phase 1 context if required.
   - Enforce structured output for final OrcaSlicer table (JSON schema) and request `reasoning.summary: "concise"` for UI tooltips.
   - If DOE scores are large, consider `background: true` plus polling for `status`.

4. **Streaming UI**
   - Hook DOE UI to SSE event stream to display step-level progress: show when web search is running, when reasoning tokens complete, and when final JSON arrives.
   - Handle `response.error` and `response.failed` events to surface actionable errors.

5. **Security & quotas**
   - Respect `max_tool_calls`/`max_output_tokens` guardrails to limit runaway requests.
   - Use domain filters and approximate location settings to comply with user privacy expectations.

6. **Testing recommendations**
   - Add unit fixtures for successful responses (with tool calls + JSON schema output) and for failure cases (schema violation, tool cap exceeded).
   - Implement integration test hitting the OpenAI mock server or recorded cassette to validate streaming parser and JSON schema handling.

## Quick reference payload templates
### Phase 1 (spec + ranges)
```ts
await openai.responses.create({
  model: 'gpt-5',
  instructions: phase1SystemPrompt,
  input: buildPhase1Input(formData),
  tools: [
    { type: 'web_search', search_context_size: 'medium', user_location: { type: 'approximate', approximate: { country: 'US' } } }
  ],
  include: ['web_search_call.action.sources'],
  reasoning: { effort: 'medium', summary: 'concise' },
  text: { format: makePhase1Schema() },
  stream,
});
```

### Phase 2 (analysis)
```ts
await openai.responses.create({
  model: 'gpt-5',
  instructions: phase2SystemPrompt,
  input: buildAnalysisInput(scoredRuns),
  tool_choice: 'none',
  reasoning: { effort: 'high', summary: 'detailed' },
  text: { format: makePhase2Schema() },
  include: ['message.output_text.logprobs'],
  stream,
});
```

Keep this file close while wiring the new GPT-5 integrations; update it as OpenAI ships API revisions.
