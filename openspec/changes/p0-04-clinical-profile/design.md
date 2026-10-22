# Design — Intake completion and clinical profile

## Context

Priority P0; dependencies: P0-03.

## Goals / Non-Goals

Goal: finish habits/medications/examination/review steps and consolidate the versioned profile.

Non-goals: unrelated modules, real data, new clinical criteria invented by agents.

## Decisions

Affected areas: intake/profile features, examination contracts, patient reference routes.

Use feature-owned schemas and pure domain logic, Server Components for presentation and server-only services for persistence/provider operations. Reuse existing contracts and tokens. Preserve unknown values, provenance and immutable version links. Refine concrete service/API details in this file before implementation, after inspecting dependency changes; do not create a second plan elsewhere.

## Required verification

conditional questions, unknown examination date/result, concurrent edits, repeat submit, persisted profile matches answers, flow A pre-analysis slice.

Run pnpm verify and pnpm test:e2e for completion, with focused regression coverage first. All provider tests use synthetic inputs; live API checks require separately supplied credentials and authorization.

## Risks / Trade-offs

Check ownership, duplicate operations, stale versions and failures at the affected server boundary. Schema parsing alone is not medical approval. Clinical criteria remain the qualified medical owner's responsibility.

## Open Questions

Resolve external inputs called out in dependencies before the corresponding implementation step; record decisions here. Current changes are planning artifacts, not completed product behavior.
