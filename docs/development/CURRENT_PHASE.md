# Current Phase: Phase 2

## Name

**Phase 2: Core Personal Workspace**

## Current Slice

**AI Provider Foundation — Ollama**

This slice is complete. NOVA now provides a clean AI provider abstraction (`AIProvider`) backed by a local `OllamaProvider` implementation. A dedicated, read-only chat endpoint `POST /api/assistant/chat` allows users to converse with the AI provider from a functional, responsive frontend tab.

## Implemented

- `AIProvider` interface defining the contract for AI provider communication (`String chat(String userMessage)`).
- `AIProviderException` for clean error handling across unavailable, timeout, HTTP, and JSON parsing failures (mapped to HTTP 502 Bad Gateway in `ApiExceptionHandler`).
- `OllamaProvider` implementing `AIProvider` with Jackson 3.x and Spring `RestClient` targeting Ollama's `/api/generate` endpoint.
- Configured base URL and model via environment variables (`OLLAMA_BASE_URL` and `OLLAMA_MODEL`) with local defaults (`http://localhost:11434` and `llama3`).
- `AssistantChatService` depending exclusively on `AIProvider` (isolated from Tasks, Memory, and DB repos).
- `AssistantChatController` exposing `POST /api/assistant/chat` accepting validated `AssistantChatRequest` (`message`) and returning `AssistantChatResponse` (`reply`).
- Responsive frontend Assistant tab UI allowing real-time chat with the AI provider, complete with loading, reply, and error state feedback.
- Mocked `AIProvider` in Spring Boot integration tests ensuring full test execution without requiring a live Ollama process.
- Verified all 15 backend Spring Boot integration tests and 10 frontend unit/integration tests pass.

## Architecture Boundary

`React -> POST /api/assistant/chat -> AssistantChatService -> AIProvider -> OllamaProvider -> Ollama`

The AI Provider domain is read-only and strictly isolated from Task and Memory repositories, JPA entities, and database access.

## Out of Scope

- Tool execution or Assistant tool calling
- Memory/Task access from AI classes
- Direct DB mutation from AI classes
- Embeddings, pgvector, or RAG
- Gemini or OpenAI providers
- Multi-turn conversation persistence

## Validation Status

Backend Maven tests (`15 passed`), frontend typecheck, lint, vitest tests (`10 passed`), and production build pass for this slice.

## Next Phase 2 Work

The next slice will introduce Assistant tool capabilities or memory integration as explicitly planned.

