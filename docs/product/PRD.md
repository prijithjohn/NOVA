# NOVA Product Requirements Document

## Product

NOVA is a Personal AI Operating System that helps one user think, plan, remember, and act from a coherent personal workspace.

## Problem

Personal context is fragmented across notes, tasks, calendars, documents, financial records, and progress tracking. NOVA should help the user turn that context into clear decisions and next actions without pretending to automate actions it cannot safely perform.

## Product Principles

- User control: the user can inspect, confirm, correct, and delete personal information.
- Explicit state: records, plans, and actions have clear status and ownership.
- Traceable assistance: AI suggestions identify the context they use and require confirmation for consequential mutations.
- Privacy by default: personal data is isolated to its owner and protected by authentication and authorization.
- Small useful steps: each workflow should produce a concrete understanding, plan, memory, or action.

## Core Domains

- **Assistant:** Conversational support for questions, summaries, decisions, planning, and guided actions across NOVA.
- **Memory:** User-controlled capture, retrieval, correction, and deletion of durable personal context.
- **Goals:** Desired outcomes with measurable progress, time horizons, and supporting tasks.
- **Tasks:** Actionable work with status, priority, due dates, and links to goals or context.
- **Calendar:** Time-based commitments and planned work represented as events or time blocks. No external calendar integration is assumed in Phase 0.
- **Finance:** User-managed financial records, budgets, and summaries. No bank or payment integration is assumed in Phase 0.
- **Documents:** User-managed documents and useful extracted or linked context.
- **Analytics:** Transparent summaries of progress, workload, time, and financial information derived from NOVA data.

## Initial Requirements

1. The product definition must treat the eight domains as a connected system, while each domain retains clear ownership of its data and behavior.
2. The Assistant may help the user read, organize, and plan across domains, but AI-initiated mutations must pass through validated services and normal business rules.
3. The user must remain able to review, correct, and remove stored information.
4. Domain records must have explicit states and relationships so summaries and analytics can be explained from source data.
5. Requirements must distinguish implemented behavior from future ideas; unsupported integrations are out of scope until explicitly specified.

## Phase 0 Scope

Phase 0 establishes the product definition and delivery foundation only. It includes this PRD, the product vision, user stories, the roadmap, and the current-phase acceptance criteria. It includes no application code, UI, integrations, dependencies, or persisted user data.

## Out of Scope

- Application code or user interface implementation
- External service, calendar, banking, payment, document, or analytics integrations
- Autonomous actions without user confirmation and validated business rules
- Production infrastructure and deployment configuration
- Claims about capabilities not defined in this document

## Success Direction

NOVA is successful when a user can build a trustworthy personal operating picture: understand context, choose goals, organize tasks and time, preserve useful memory, inspect records, and take deliberate action with assistance that remains transparent and under user control.
