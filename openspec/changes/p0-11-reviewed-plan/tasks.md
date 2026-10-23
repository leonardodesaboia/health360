## Implementation

- [x] 1. Add failing derivation tests for complete decisions, modifications, rejection, pending/clarification, evidence, ownership and stale cycles; implement the pure guard and builder.
- [ ] 2. Implement dataset-scoped atomic publication and legal workflow transition with idempotence and service regression tests.
- [ ] 3. Replace static plan route with persisted reviewed content and explicit unavailable/error states; add desktop/mobile e2e coverage.
- [ ] 4. Run full verification and responsive/keyboard checks; self-review clinical, design, security and spec conformance; record real evidence.
- [ ] 5. Archive the implemented change, update canonical docs/index, and open a PR to protected main; request AO review and address findings.

## Evidence so far

- TDD: focused derivation test initially failed with missing `./build`; implementation then passed 23 derivation cases.
- `pnpm exec vitest run src/features/preventive-plan src/server/preventive-plan`: 3 files, 34 tests passed (2026-10-23).
- `pnpm exec openspec validate --all --strict --no-interactive`: 6 passed, 0 failed.
- `pnpm typecheck`: Prisma and route type generation passed; TypeScript fails only on missing upstream `../demo/session` and `../workflow/state` modules. No production stub added. Full verification, transaction integration, browser checks and archive remain outstanding.
