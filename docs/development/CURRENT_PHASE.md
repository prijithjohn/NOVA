# Current Phase: Phase 2

## Name

**Phase 2: Core Personal Workspace**

## Current Slice

**Slice 2: Task filtering, search, and sorting**

This slice is complete. NOVA now lets users find and organize persisted tasks through backend/database-backed status filtering, case-insensitive title and description search, and creation-time sorting.

## Implemented

- `GET /api/tasks` query parameters:
  - `status=all|active|completed`
  - `search=<text>`
  - `sort=newest|oldest`
- Backwards-compatible no-parameter task listing using all tasks and newest-first ordering.
- Spring Data JPA query support for filtering, search, and sorting in PostgreSQL.
- Case-insensitive search across task titles and descriptions.
- HTTP 400 responses for invalid status and sort values.
- Frontend filter controls for All, Active, and Completed.
- Frontend title/description search and Newest first/Oldest first sorting.
- Meaningful loading, empty, and no-matching-task states.
- Existing task creation, completion/reopen, and deletion behavior preserved.

## Out of Scope

- Assistant, AI, Memory, Goals, Calendar, Finance, Documents, or Analytics
- Authentication or authorization
- External integrations
- Redis, RabbitMQ, microservices, CQRS, event sourcing, pagination, notifications, or recurring tasks
- Fake data or client-side primary filtering of the task dataset

## Validation Status

Maven tests and package build, frontend tests/typecheck/lint/build/format checks, real PostgreSQL query behavior, existing CRUD behavior, frontend query requests, desktop/mobile verification, and current browser error checks pass for this slice.

## Next Phase 2 Work

The next slice must be explicitly scoped before adding another task capability or domain workflow.
