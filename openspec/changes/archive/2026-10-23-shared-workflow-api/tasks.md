## Implementation

- [x] 1. Add audit schema and workflowTransition storage model/repository kind; validate with unit tests and migration deploy.
- [x] 2. Implement transaction-compatible state API; prove status, audit, scope, stale/illegal rejection, concurrency, immutability and rollback using PostgreSQL tests.
- [x] 3. Update architecture/workflow docs and pass verify, DB integration, desktop/mobile e2e, format and strict OpenSpec checks; self-review clinical/security/spec boundaries.

## Workflow follow-up

- Archive after verified implementation; open a small PR to main, request AO native review and report exported signatures and real checks. Never merge.

## Evidence

- Red: workflow audit unit test and integration suite failed on missing contracts/state modules before implementation.
- Green: audit schema unit test passed; PostgreSQL 17 migration deployed; 13 DB integration tests pass (15.51s), including existing persistence regressions plus scope, expectedFrom, illegal edges, actor/reason/refs round-trip, concurrency, immutable history and dataset deletion.
- The inDatasetTransaction second callback argument is additive. The integration test appends a profile plus transition in one callback and proves both commit or both roll back.
- No workflow graph, UI, label or clinical gate changes. Internal services must enforce clinical preconditions; actor is audit metadata and grants no authority. No real data or model calls. Self-review checks schema/server-only boundaries and all spec scenarios; no independent reviewer claimed yet.

- ABA extension: 15 PostgreSQL integration tests passed (18.64s), including superseded analysis rejection with profile-write rollback, current-attempt acceptance, missing-ref rejection and getWorkflowState lock ownership. Optional expectedRefs are compared to latest transition refs; mismatches use exported StaleStateError.
- Final ABA implementation: pnpm verify passed skills checks, 6 tooling tests, ESLint, strict typecheck, 175 unit tests and production build. PostgreSQL integration: 15 tests passed (20.70s). Format and strict OpenSpec validation passed (7 items). Production Playwright: 28 desktop/mobile tests passed (1.6m) before the server-only ABA extension; orchestrator explicitly authorized reusing that result for publication. No UI code changed in this PR.
