# Design — Summaries of changes

## Context

Priority P1; dependencies: P1-02, P0-06, P0-07.

## Goals / Non-Goals

Goal: concise contextual summaries grounded in structured version differences.

Non-goals: unrelated modules, real data, new clinical criteria invented by agents.

## Decisions

Affected areas: future AI summary service/validators and history view.

Use feature-owned schemas and pure domain logic, Server Components for presentation and server-only services for persistence/provider operations. Reuse existing contracts and tokens. Preserve unknown values, provenance and immutable version links. Refine concrete service/API details in this file before implementation, after inspecting dependency changes; do not create a second plan elsewhere.

## Required verification

invented-change rejection, stale version, empty diff, timeout, no autonomous recommendation.

Run pnpm verify and pnpm test:e2e for completion, with focused regression coverage first. All provider tests use synthetic inputs; live API checks require separately supplied credentials and authorization.

## Risks / Trade-offs

Check ownership, duplicate operations, stale versions and failures at the affected server boundary. Schema parsing alone is not medical approval. Clinical criteria remain the qualified medical owner's responsibility.

## Open Questions

Resolve external inputs called out in dependencies before the corresponding implementation step; record decisions here. Current changes are planning artifacts, not completed product behavior.
