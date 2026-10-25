## Implementation

- [x] 1. Add failing tests for rule references on redundant proposals, non-redundant and unknown/missing-date cases, and model-supplied metadata; add the optional contract field and stamp references in prepareAnalysis.
- [x] 2. Add a DB integration test: repeat-screening through analyzeSession with the mock provider persists a traceable POSSIBLE_REDUNDANCY proposal; patient reader stays status-only.
- [x] 3. Update architecture, user flows and the ordered index; self-review spec, clinical and TypeScript gates.
- [x] 4. Run pnpm verify, DB integration, PORT=3210 pnpm test:e2e, format check and strict OpenSpec validation; record actual output.
- [x] 5. Archive, open the P0-08 PR to main, request AO native review and report.

## Verification evidence (2026-10-25, on main e855869)

- Red first: the two traceability tests failed on missing `ruleReferences` before implementation; unit file src/server/analysis/do-not-test.test.ts now 8 passed (redundant, interval reached, unknown date, abnormal/incomplete/unknown-preparation, missing record, model-supplied rule references).
- `pnpm test:integration` (disposable PostgreSQL 17): 9 files, 60 passed. tests/integration/do-not-test.test.ts seeds the repeat-screening demo case, completes Jordan's intake through the intake service, analyzes with the echoing mock provider and asserts the persisted POSSIBLE_REDUNDANCY proposal (rule crc-routine-repeat v1, evidence in stored context, examination data, redundancy limitation), no review/plan and a null patient plan; unknown date routes to CLARIFICATION_REQUIRED with no proposals.
- `pnpm verify`: lint and typecheck clean; Vitest 30 files / 386 passed (1 skipped); production build compiled.
- `PORT=3210 pnpm test:e2e`: 58 passed (desktop and mobile).
- `pnpm format:check`: pass. `openspec validate --all --strict`: 15 passed, 0 failed.
- Not covered here: physician presentation of `ruleReferences` (P0-09/P0-10 owners) and a live browser walkthrough.
