# Design — Validation and analysis orchestration

## Context

Priority P0; dependencies: P0-06.

## Goals / Non-Goals

Goal: validate evidence/category/required-field integrity and persist preliminary analysis safely.

Non-goals: unrelated modules, real data, new clinical criteria invented by agents.

## Decisions

Affected areas: future AI validators/services, analysis contracts, workflow service, status UI.

Use feature-owned schemas and pure domain logic, Server Components for presentation and server-only services for persistence/provider operations. Reuse existing contracts and tokens. Preserve unknown values, provenance and immutable version links. Refine concrete service/API details in this file before implementation, after inspecting dependency changes; do not create a second plan elsewhere.

## Required verification

adversarial structured output, fabricated reference, stale profile, duplicate request, timeout/retry, safe error copy; flow E.

Run pnpm verify and pnpm test:e2e for completion, with focused regression coverage first. All provider tests use synthetic inputs; live API checks require separately supplied credentials and authorization.

## Risks / Trade-offs

Check ownership, duplicate operations, stale versions and failures at the affected server boundary. Schema parsing alone is not medical approval. Clinical criteria remain the qualified medical owner's responsibility.

## Open Questions

Resolve external inputs called out in dependencies before the corresponding implementation step; record decisions here. Current changes are planning artifacts, not completed product behavior.
