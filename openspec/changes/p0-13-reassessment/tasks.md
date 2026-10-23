## Implementation

- [x] 1. Write failing timeline projection tests; implement ordering, linked versions, semantic deduplication and patient isolation.
- [ ] 2. Add dataset/session-scoped history and historical plan readers plus guarded reassessment entry with stale/repeat/ownership tests.
- [ ] 3. Add patient history UI, historical plan pages and navigation using shared design components.
- [ ] 4. Integrate persisted intake/profile submission and analysis trigger; verify the second review/plan cycle preserves the original plan.
- [ ] 5. Run full verification, desktop/mobile and keyboard checks, self-review, archive, update docs/index and open a PR to main; request AO review and address findings.

## Evidence so far

- TDD: timeline suite first failed with missing `./history`; seven initial tests passed after implementation. All six consolidated timeline kinds from PR #13 now have label/link tests.
- Reassessment regression reproduced a failed-analysis request resolving instead of rejecting; explicit PLAN_AVAILABLE gate added and the test passes.
- Focused Vitest: 4 files, 28 tests passed after adapting to the canonical transaction/dataset workflow API; full producer flow D remains unverified.
