## Context

The shared wave-two brief and backlog P0-07 define the scope. Existing contracts embed RecommendationProposals inside AIAnalysis; repository append also creates their relational rows. No independent proposal writer is needed. The shared workflow API now serializes dataset/patient reads and transitions. `inDatasetTransaction` supplies `(repo, tx)`; `getWorkflowStatus(tx, datasetId, patientId)` holds the lock through domain checks/writes, and transitions use `expectedRefs` to bind completion to the reserved analysis ID/profile version.

## Decisions

1. Keep orchestration in `src/server/analysis`, separate from the adapter worker's `src/server/ai`. Consume its existing Zod contract rather than introduce another model-output schema.
2. Use the latest profile for the session patient and the supported demonstrative clinical context. Never derive risk booleans from free text. Tri-state OR returns true if any input is true, false only if every input is false, otherwise null.
3. Run deterministic evaluation first. Only READY_FOR_REVIEW can produce proposals. NEEDS_CLARIFICATION goes through ANALYSIS_PENDING to CLARIFICATION_REQUIRED with explicit gaps; blocked/out-of-scope or adapter failure goes to ANALYSIS_FAILED.
4. Provider payload contains only rule-relevant structured facts, findings, limits and public evidence. Exclude identifiers, names, unrelated free text and examination notes.
5. Reparse structured output and require an exact supported finding for every proposal: category, rule IDs and evidence. Reject missing required findings as well as invented findings. Keep deterministic considered data and limits with each persisted proposal.
6. Snapshot versions before the provider call; recheck profile/context and workflow state inside the final transaction. Serialize same-dataset mutation and make successful requests idempotent by profile/context version. A failed attempt remains immutable and may be retried with a new analysis version.
7. Optional `promptId` and a bounded `failureReason` enum extend AIAnalysis JSON without a SQL migration. Existing records remain valid. Provider errors never persist as free text.
8. Server action resolves the cookie session, scopes every repository to its dataset, and returns bounded English status/error copy. It never accepts a client-supplied dataset or patient identifier.

## Verification plan

Colocated unit tests prove tri-state behavior, strict proposal integrity, input minimization, timeouts/errors, no proposals on blocked/unknown/stale data, successful idempotency, concurrent requests, dataset isolation and event/transition atomicity. Database integration checks cover actual persistence where a test database is available. Full verify, e2e on PORT=3210, formatting and strict OpenSpec validation precede archive and PR. Manual source review applies spec, TypeScript, security and clinical publication boundaries; no independent clinical validation is claimed.

## Non-goals

No physician or plan writes, unrestricted chat, new medical criteria, deployment or live provider call. P0-08 and P0-12 remain separate follow-up tasks/PRs.

## Pending integration contracts

The P0-02 session module is `src/server/demo/session.ts`; the service accepts only the dataset/case/patient keys from DemoSession and reloads current records rather than trusting its profile snapshot. P0-04 owns the shared intakeFacts schema. Shared timeline PR #13 owns ANALYSIS_FAILED and CLARIFICATION_REQUESTED; this change adds no timeline enum or SQL migration. The demo owner must seed a dataset-scoped ClinicalContext, or the orchestrator must explicitly assign initial context snapshot writes to analysis. Until that decision and the prerequisite merges, runtime verification remains pending.
