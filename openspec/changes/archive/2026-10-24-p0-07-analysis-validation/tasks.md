## Implementation

- [x] 1. Add failing tests for tri-state mapping, minimized requests and adversarial proposal integrity; implement mapping and validation.
- [x] 2. Add failing service tests for failure, freshness, dataset scope, retry and concurrency; implement transactional orchestration against shared contracts.
- [x] 3. Wire the session-bound analyze action to intake completion and retry; verify no unreviewed proposals reach patients.
- [x] 4. Update architecture, user flows and index; self-review spec conformance, TypeScript, security and clinical gates.
- [x] 5. Run pnpm verify, PORT=3210 pnpm test:e2e, pnpm format:check and strict OpenSpec validation; record actual output here.
- [x] 6. Archive only completed work, open the P0-07 PR to main, request AO native review and report the URL with verification.

## Verification evidence (2026-10-24, rebased on main 729e746 with P0-02, P0-04, intake wiring and P0-11)

- Focused analysis unit tests: 6 files, 55 passed (tri-state mapping, minimization, adversarial evidence/rules/categories, failure, freshness, retry, concurrency, cookie-bound action/reader).
- `pnpm test:integration` against disposable PostgreSQL 17: 7 files, 56 passed, including tests/integration/analysis.test.ts.
- `pnpm verify`: ESLint clean, strict typecheck clean, Vitest 23 files / 342 passed (1 skipped), production build compiled.
- `PORT=3210 pnpm test:e2e`: 46 passed (desktop and mobile), including tests/e2e/analysis.spec.ts.
- `pnpm format:check`: all files pass. `openspec validate --all --strict`: 13 passed, 0 failed.
- Not verified: a live browser walkthrough of the DB-backed analyze flow. Case-selection UI is not yet on main, so e2e covers the no-session and bounded-error states; the session-backed path is covered by integration and action tests.
