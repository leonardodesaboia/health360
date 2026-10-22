# Design — Deterministic clarification loop

## Context

Priority P0; dependencies: P0-07, P0-10.

## Goals / Non-Goals

Goal: collect application-selected missing fields without a chatbot.

Non-goals: unrelated modules, real data, new clinical criteria invented by agents.

## Decisions

Affected areas: clarification feature, intake/profile updates, workflow service.

Use feature-owned schemas and pure domain logic, Server Components for presentation and server-only services for persistence/provider operations. Reuse existing contracts and tokens. Preserve unknown values, provenance and immutable version links. Refine concrete service/API details in this file before implementation, after inspecting dependency changes; do not create a second plan elsewhere.

## Required verification

supported/unsupported fields, unknown answer, refresh recovery, new profile version, stale review rejection, no direct transition to plan; flow C.

Run pnpm verify and pnpm test:e2e for completion, with focused regression coverage first. All provider tests use synthetic inputs; live API checks require separately supplied credentials and authorization.

## Risks / Trade-offs

Check ownership, duplicate operations, stale versions and failures at the affected server boundary. Schema parsing alone is not medical approval. Clinical criteria remain the qualified medical owner's responsibility.

## Open Questions

Resolve external inputs called out in dependencies before the corresponding implementation step; record decisions here. Current changes are planning artifacts, not completed product behavior.
