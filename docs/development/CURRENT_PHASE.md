# Current Phase: Phase 2

## Name

**Phase 2: Core Personal Workspace**

## Current Slice

**AI Structured Tool Calling**

This slice is complete. NOVA now connects natural-language Assistant chat to controlled tool execution (`AssistantToolRegistry` -> `CreateTaskTool` -> `TaskService` -> PostgreSQL) via structured AI decisions.

## Implemented

- `AIProvider.AssistantDecision` structured decision contract (`action`, `arguments`, `reply`).
- `OllamaProvider.decide(userMessage)` sending system instructions and JSON mode (`"format": "json"`) to Ollama `/api/generate`.
- `AssistantChatService` validating AI proposed decisions:
  - `"none"`: returns conversational reply without mutation.
  - `"create_task"`: validates non-blank title and allowed priority enums (`LOW`/`MEDIUM`/`HIGH`), generates idempotency key, and executes via `AssistantToolRegistry` -> `CreateTaskTool`.
  - Unknown/unsupported actions: rejected safely without executing tool or mutating database.
- `AssistantChatResponse` updated to return `reply`, `action`, and `task` (`TaskResponse`).
- Updated Assistant chat UI to display created task details when task creation tool is executed by the AI.
- Comprehensive integration tests covering natural-language task creation, `"none"` decision, unknown action rejection, invalid priority rejection, malformed AI JSON output handling, and provider 502 error handling.
- Verified 18 backend Spring Boot integration tests and 11 frontend unit/integration tests pass.

## Architecture Boundary

`User -> POST /api/assistant/chat -> AssistantChatService -> AIProvider -> Structured Decision -> Backend Validation -> AssistantToolRegistry -> CreateTaskTool -> TaskService -> PostgreSQL`

The AI model proposes structured actions; backend validation strictly enforces security and execution boundaries before invoking tools.

## Out of Scope

- Multi-tool orchestration or autonomous agent loops
- Memory domain tool calling or semantic search
- Direct DB access or entity access from AI classes
- Gemini/OpenAI providers or RAG/pgvector

## Validation Status

Backend Maven tests (`18 passed`), frontend typecheck, lint, vitest tests (`11 passed`), and production build pass for this slice.

## Next Phase 2 Work

The next slice will introduce Memory domain tools or assistant context integration as planned.


