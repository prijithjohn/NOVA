# Current Phase: Phase 2

## Name

**Phase 2: Core Personal Workspace**

## Current Slice

**Task priority**

This slice is complete. NOVA tasks now persist LOW, MEDIUM, or HIGH priority, support priority filtering, and expose priority through the existing task workflow without changing status filtering, search, sorting, or CRUD behavior.

## Implemented

- Task priority persistence in PostgreSQL.
- Flyway migration `V2__add_task_priority.sql` with a MEDIUM default and valid-value constraint.
- Priority in task creation requests and responses.
- Optional priority updates through the existing PATCH endpoint.
- Backend `priority=all|LOW|MEDIUM|HIGH` filtering through the repository query.
- HTTP 400 responses for invalid priority values.
- Frontend create-time priority selection and task priority display.
- Frontend priority filter alongside existing status, search, and sort controls.
- Backend and frontend priority test coverage.

## Preserved

- Create, edit/update, complete, reopen, and delete behavior.
- Existing status filtering, title/description search, and newest/oldest sorting.
- Backwards-compatible task requests without a priority, which default to MEDIUM.

## Out of Scope

- Assistant, AI, Memory, Goals, Calendar, Finance, Documents, or Analytics
- Authentication or authorization
- Notifications, recurring tasks, pagination, external integrations, Redis, RabbitMQ, microservices, CQRS, or event sourcing

## Validation Status

Maven tests and package build, frontend tests/typecheck/lint/build/format checks, Flyway migration execution, real PostgreSQL priority CRUD/filter behavior, frontend-to-API persistence, desktop/mobile verification, and runtime error checks pass for this slice.

## Next Phase 2 Work

The next slice must be explicitly scoped before adding another task capability or domain workflow.
