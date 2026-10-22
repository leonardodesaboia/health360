# Design — Do Not Test slice

## Context

Priority P0; dependencies: P0-05, P0-07.

## Goals / Non-Goals

Goal: contextualize possible redundancy from a medically supplied deterministic rule.

Non-goals: unrelated modules, real data, new clinical criteria invented by agents.

## Decisions

Affected areas: rules, analysis output, proposal/evidence presentation.

Use feature-owned schemas and pure domain logic, Server Components for presentation and server-only services for persistence/provider operations. Reuse existing contracts and tokens. Preserve unknown values, provenance and immutable version links. Refine concrete service/API details in this file before implementation, after inspecting dependency changes; do not create a second plan elsewhere.

## Required verification

medically specified redundant/nonredundant/unknown cases, missing dates, rule/proposal traceability, no automatic patient advice; flow B through proposal stage.

Run pnpm verify and pnpm test:e2e for completion, with focused regression coverage first. All provider tests use synthetic inputs; live API checks require separately supplied credentials and authorization.

## Risks / Trade-offs

Check ownership, duplicate operations, stale versions and failures at the affected server boundary. Schema parsing alone is not medical approval. Clinical criteria remain the qualified medical owner's responsibility.

## Open Questions

Resolve external inputs called out in dependencies before the corresponding implementation step; record decisions here. Current changes are planning artifacts, not completed product behavior.
