# Design — Reviewed preventive plan

## Context

Priority P0; dependencies: P0-10.

## Goals / Non-Goals

Goal: publish a patient-facing version derived solely from finalized physician decisions.

Non-goals: unrelated modules, real data, new clinical criteria invented by agents.

## Decisions

Affected areas: preventive-plan feature, publication service, `/patient/plan`, contracts.

Use feature-owned schemas and pure domain logic, Server Components for presentation and server-only services for persistence/provider operations. Reuse existing contracts and tokens. Preserve unknown values, provenance and immutable version links. Refine concrete service/API details in this file before implementation, after inspecting dependency changes; do not create a second plan elsewhere.

## Required verification

reject/pending exclusion, ownership, review bypass rejection, stale cycle rejection, repeat publication idempotency, output matches decisions; complete flows A/B.

Run pnpm verify and pnpm test:e2e for completion, with focused regression coverage first. All provider tests use synthetic inputs; live API checks require separately supplied credentials and authorization.

## Risks / Trade-offs

Check ownership, duplicate operations, stale versions and failures at the affected server boundary. Schema parsing alone is not medical approval. Clinical criteria remain the qualified medical owner's responsibility.

## Open Questions

Resolve external inputs called out in dependencies before the corresponding implementation step; record decisions here. Current changes are planning artifacts, not completed product behavior.
