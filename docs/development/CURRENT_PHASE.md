# Current Phase: Phase 2

## Name

**Phase 2: Core Personal Workspace**

## Current Slice

**Memory domain foundation**

This slice is complete. NOVA now persists durable personal context records in PostgreSQL through a dedicated `MemoryService` and REST API, with full create, list, and delete capabilities, and an explicit responsive frontend workspace.

## Implemented

- Flyway migration `V4__create_memories.sql` creating `memories` table with UUID primary key, non-blank content constraint, and index on `created_at DESC`.
- JPA `Memory` entity with UUID generation and timestamp management.
- `MemoryRepository` with creation-timestamp ordered listing.
- `MemoryService` with validation (non-blank content) and delete-by-id handling.
- `MemoryController` exposing `POST /api/memories`, `GET /api/memories`, and `DELETE /api/memories/{id}`.
- DTOs `CreateMemoryRequest` and `MemoryResponse`.
- Consistent error handling for `MemoryNotFoundException` (404) and validation errors in `ApiExceptionHandler`.
- Complete domain isolation of Memory from Tasks and Assistant internals.
- Responsive Memory UI with domain navigation, create form, memory list, formatted timestamps, and delete action.
- Explicit loading, empty, success, and error states.
- Preserved all existing Task CRUD, priority, filtering, search, sorting, and Assistant create-task behavior.
- Automated integration test coverage for backend and frontend Memory capabilities.

## Architecture Boundary

`MemoryController -> MemoryService -> MemoryRepository -> PostgreSQL`

The Memory domain is completely decoupled from Tasks and Assistant. No LLM, RAG, embeddings, pgvector, or semantic search is included.

## Out of Scope

- Embeddings, pgvector, RAG, Ollama, Gemini, or semantic search
- Memory update/editing or Assistant memory tools
- Authentication or authorization
- Goals, Calendar, Finance, Documents, Analytics, notifications, or other future features

## Validation Status

Maven integration tests, Flyway migration execution, real PostgreSQL persistence, frontend typecheck, lint, vitest tests, Prettier format, and production build pass for this slice.

## Next Phase 2 Work

The next slice must be explicitly scoped before adding Assistant memory actions, memory editing, or another domain workflow.
