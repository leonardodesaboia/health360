## Phase A: server session module (PR a)

- [x] 1. Validate prepared case/token contracts and immutable mapping; focused unit tests pass without mutating source scenarios.
- [x] 2. Add Dataset.scenarioId migration, load/replace/reset storage APIs and real PostgreSQL tests for current profile/state, idempotency, isolation, concurrent switches and invalid cases.
- [x] 3. Add read-only cookie resolver, server-context selection/reset helpers and lazy DB client; unit-test invalid/missing cookies, no fallback, secure cookie options and write failures.
- [x] 4. Document exact exported APIs and phase boundaries; pass verify, integration, unchanged production e2e, format and strict OpenSpec validation; self-review clinical/security/spec boundaries.

## Phase B: presenter UI (separate PR)

- [ ] 5. Wire selector and case/reset controls, patient home, physician queue and case-scoped workspace with empty/error/pending states. Do not modify intake or plan routes owned by other workers.
- [ ] 6. Add desktop/mobile e2e for shared case, refresh, reset, empty states, review 404 and retained labels; verify UI and archive only once the complete task is implemented.

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
