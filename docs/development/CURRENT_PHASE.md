# Current Phase: Phase 2

## Name

**Phase 2: Core Personal Workspace**

## Current Slice

**Assistant tool foundation: create task**

This slice is complete. NOVA now exposes one deterministic, controlled Assistant action that creates a persisted task through the existing TaskService.

## Implemented

- Structured `POST /api/assistant/actions` endpoint.
- Small Assistant tool abstraction and registry.
- `CreateTaskTool` for the `create_task` action.
- Validated structured input including title, description, priority, tool, action, and idempotency key.
- Service-owned idempotency persistence through `assistant_action_executions`.
- Repeated execution with the same idempotency key returns the original task instead of creating a duplicate.
- DTO-based structured Assistant response with action, tool, status, replay flag, and task result.
- Minimal frontend Assistant create-task form with loading, success, and error states.
- Existing task CRUD, status filtering, priority filtering, search, and sorting preserved.

## Architecture Boundary

`AssistantActionController -> AssistantToolRegistry -> CreateTaskTool -> TaskService -> TaskRepository -> PostgreSQL`

`CreateTaskTool` does not access repositories, JPA entities, or the database directly. No LLM, RAG, memory, or AI infrastructure is included.

## Out of Scope

- Ollama, Gemini, RAG, memory, or autonomous AI behavior
- Assistant actions other than create task
- Authentication or authorization
- Goals, Calendar, Finance, Documents, Analytics, notifications, or other future features

## Validation Status

Maven tests and package build, frontend tests/typecheck/lint/build/format checks, Flyway migration execution, real PostgreSQL Assistant action/idempotency behavior, frontend action flow, desktop/mobile verification, and runtime error checks pass for this slice.

## Next Phase 2 Work

The next slice must be explicitly scoped before adding another Assistant action or domain workflow.
