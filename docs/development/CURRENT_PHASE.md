# Current Phase: Phase 2

## Name

**Phase 2: Core Personal Workspace**

## Current Slice

**Slice 1: Real task management**

This slice is complete. NOVA now supports persisted task creation, listing, completion changes, and deletion through a Spring Boot REST API backed by PostgreSQL, with a responsive React task workspace.

## Implemented

- PostgreSQL local development service through `compose.yaml`.
- Spring Data JPA task entity and repository.
- Flyway migration `V1__create_tasks.sql` for the `tasks` table and index.
- Task service/business layer with normalized input and not-found handling.
- DTO-based REST API:
  - `GET /api/tasks`
  - `POST /api/tasks`
  - `PATCH /api/tasks/{id}`
  - `DELETE /api/tasks/{id}`
- Request validation for title and description length.
- HTTP 400 validation responses, HTTP 404 not-found responses, HTTP 201 creation responses, and HTTP 204 deletion responses.
- Frontend task creation, persisted listing, completion/reopen, deletion, loading, empty, error, and success states.
- Backend Spring/MockMvc coverage and frontend interaction coverage.

## Out of Scope

- Assistant, AI, Memory, Goals, Calendar, Finance, Documents, or Analytics
- Authentication or authorization
- External integrations
- Redis, RabbitMQ, microservices, CQRS, or event sourcing
- Dashboard, statistics, mock task data, or in-memory task storage

## Configuration

The backend requires `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`. Local PostgreSQL container values are documented in `.env.example`; credentials are supplied through the environment and are not committed.

## Validation Status

Maven tests and package build, frontend tests/typecheck/lint/build/format checks, Flyway migration execution, real PostgreSQL CRUD, frontend-to-API persistence, desktop/mobile verification, and current browser error checks pass for this slice.

## Next Phase 2 Work

The next slice must be explicitly scoped before adding another domain or workflow.
