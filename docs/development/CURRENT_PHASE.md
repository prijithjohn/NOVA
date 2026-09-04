# Current Phase: Phase 1

## Name

**Phase 1: Application Foundation**

## Current Slice

**Slice 1: Runnable project foundation**

This slice is complete. NOVA now has a React + TypeScript + Vite frontend, a Java + Spring Boot backend built with Maven, a minimal health endpoint, workspace quality tooling, and a frontend shell that verifies backend connectivity.

## Implemented

- npm workspace structure under `apps/frontend` and `apps/backend`.
- Frontend development server and production build through Vite.
- Backend development, production build, and start commands through Java, Spring Boot 4.1.1, and Maven.
- `GET /api/health`, returning the backend service status as JSON.
- Vite development proxy from `/api` to the backend.
- Responsive frontend shell with checking, connected, and unavailable connection states.
- JUnit/Spring backend tests and frontend unit tests.
- Type-checking, ESLint, and Prettier configuration.
- Root `.env.example` documenting the backend port and frontend API base path.

## Out of Scope

- Domain models or domain workflows
- Database or persistence
- Authentication or authorization implementation
- AI integration or orchestration
- External service integrations
- Dashboard, fake data, placeholder product screens, or future-phase features

## Acceptance Criteria

This slice is complete when:

1. The frontend starts and produces a production build.
2. The backend starts and produces a production build.
3. `GET /api/health` responds successfully with a backend health payload.
4. The frontend reaches the backend health endpoint through the development proxy and displays the connection result.
5. Backend and frontend tests pass.
6. Type checks, lint checks, and formatting checks pass.
7. Environment configuration is represented by `.env.example`; no secrets are committed.
8. Build output and dependencies are ignored by Git, and no generated or temporary files are added to source control.
9. The shell remains usable on desktop and mobile widths without introducing dashboard or domain UI.

## Validation Status

Automated checks, runtime endpoint checks, and responsive browser verification pass for this slice.

## Next Phase 1 Work

The next slice must be explicitly scoped before adding persistence, authentication, domain models, or other application behavior.
