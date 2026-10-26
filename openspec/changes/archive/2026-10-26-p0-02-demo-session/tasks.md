## Phase A: server session module (PR a)

- [x] 1. Validate prepared case/token contracts and immutable mapping; focused unit tests pass without mutating source scenarios.
- [x] 2. Add Dataset.scenarioId migration, load/replace/reset storage APIs and real PostgreSQL tests for current profile/state, idempotency, isolation, concurrent switches and invalid cases.
- [x] 3. Add read-only cookie resolver, server-context selection/reset helpers and lazy DB client; unit-test invalid/missing cookies, no fallback, secure cookie options and write failures.
- [x] 4. Document exact exported APIs and phase boundaries; pass verify, integration, unchanged production e2e, format and strict OpenSpec validation; self-review clinical/security/spec boundaries.

## Phase B: presenter UI (separate PR)

- [x] 5. Wire selector and case/reset controls, patient home, physician queue and case-scoped workspace with empty/error/pending states. Do not modify intake or plan routes owned by other workers.
- [x] 6. Add desktop/mobile e2e for shared case, refresh, reset, empty states, review 404 and retained labels; verify UI and archive only once the complete task is implemented.

## Closeout reconciliation (2026-10-26, origin/main 4445499)

- Task 5: selector, Reset and patient home landed in PR #19. The dataset-scoped physician queue (`src/app/doctor/page.tsx` via `getReviewQueue`) and case-scoped workspace (`src/app/doctor/reviews/[reviewId]/page.tsx` via `openReviewWorkspace`, `notFound()` otherwise) landed in PR #21, so the rows and workspace deliberately left out of PR #19 are now delivered.
- Task 6: `tests/e2e/demo-session.spec.ts` (entry state, shared case across views, refresh, reset, switch, retained labels), `tests/e2e/physician-reader.spec.ts` "foreign session cannot open another dataset workspace" (review 404), `tests/e2e/foundation.spec.ts` route labels, and acceptance Flow A part 1 (`tests/e2e/acceptance/journeys.spec.ts`: reset clears only its own dataset while another browser context is unchanged). Selection still yields `NOT_STARTED` (`tests/integration/demo-session.test.ts`).
- Spec reconciliation: the `demo-mode` delta no longer re-asserts disabled decisions and an unavailable plan; that requirement is removed as superseded by P0-10 physician decisions and P0-11 reviewed-plan publication, which are implemented on main.
- Fresh verification on this branch is recorded in the P0-14 closeout change evidence and the closeout PR.

Phase B progress (PR b): case selector and Reset in both shells with loading/error/pending states and a "Select a demo case" entry state; patient home greeting/status read the session. Shell routes stay static (session read via no-store `/api/demo-session`) so unknown review IDs keep their 404. Physician queue rows and the case-scoped review workspace were deliberately left unchanged at orchestrator direction, so tasks 5 and 6 stay open. Evidence: pnpm verify exit 0 (250 passed, 1 optional skipped); `PORT=3130 pnpm test:e2e` 42/42 desktop/mobile, including the new demo-session spec (entry state, shared case across views, refresh, reset, switch); format:check passed; strict OpenSpec 11/0.

## Evidence

- Red: PostgreSQL suite failed because src/server/demo/store did not exist. Existing 15 persistence/workflow tests passed in that failing run.
- Green: 12 focused demo unit tests pass; schema format/client generation and migration deploy succeed. Extended real DB suite passed 26 tests (15.79s), including current-profile/reset/concurrency coverage.
- Module PR contains no UI route changes. Page reads never seed or set cookies; invalid/absent cookies avoid the database. Storage failures propagate without fixture fallback. Demo session tokens grant no real identity or clinical authority.

## Workflow follow-up

- Publish phase A to main as the requested session-module PR; report API signatures and real results; request AO native review. Leave P0-02 in progress and do not archive partial implementation.
- Complete phase B after the module PR; intake and plan workers integrate getDemoSession themselves. Never merge.

- Full pnpm verify passed: 13 mirrored skills, 6 tooling tests, ESLint, strict typecheck, 215 unit tests passed (1 optional live-API test skipped), and production build. Format check passed; strict OpenSpec validation: 9 passed, 0 failed. Production browser regression: 28 desktop/mobile tests passed (1.9m), PORT=3147. No session-selection UI or browser session flow is claimed in this phase.

- Self-review: spec coverage for phase A maps to cookie unit tests and real DB integration tests; unknowns/source fixtures preserved, scope derived server-side, history changes only through explicit reset. Server-only import boundaries and lazy pool checked. No React/UI changes; those checks remain with phase B. No independent review claimed yet.

- Rebased onto merged timeline support: verify passed 227 unit tests (1 optional live-API test skipped) and production build; DB integration passed 39 tests before the canonical context addition. Canonical context extension: DB suite passed 40 tests (52.67s), preserving the complete P0-05 snapshot and exposing clinicalContext on the session. Final rerun with the context extension: pnpm verify exit 0 (227 passed, 1 optional live-API test skipped, production build), DB integration 40/40 on PostgreSQL 17, production e2e 28/28 desktop/mobile at PORT=3130, format:check passed, strict OpenSpec 9 passed / 0 failed.
