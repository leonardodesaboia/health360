## Implementation

- [x] 1. Add failing physician-request mapping and integration regressions.
- [x] 2. Integrate typed request reader, bounded/free-text inputs and immutable sourced answer storage with version guards.
- [x] 3. Verify the existing main answer/reanalysis transaction path and recovery, including a fresh review.
- [x] 4. Add desktop/mobile e2e, run full verification and self-review.

## Evidence so far

- TDD: physician-question tests first failed because ./physician-questions did not exist. Three new mapping/conditional-validation tests pass; the five original question tests still pass.
- Three PostgreSQL regressions use real intake, analysis, physician CLARIFY, patient answers, reanalysis and review-open services. They cover bounded/free-text requests, stale review versions, immutable prior profiles and incomplete review, null patient-reported responses, fresh review state and no plan publication.
- Before final main rebase: `pnpm verify` PASS (433 unit tests, one opt-in live test skipped, production build); `pnpm test:integration` PASS (86 tests); PORT=3250 mock-provider e2e PASS (88 desktop/mobile tests, including actual physician and patient UI handoff); formatting and strict specs PASS (20 items).
- Initial e2e run had 87 passes and one contrast scan during the shared case selector's loading opacity. The test now waits for its enabled, fully opaque state; the whole-page axe assertions remain unchanged, and the full verification sequence passed afterward.
- Rebased onto main after PR #28 merged, then onto f47bad8 with merged PR #29 security fixes. Final post-rebase results: `pnpm verify` PASS (439 unit tests, one opt-in live test skipped, production build); PostgreSQL integration PASS (86 tests); PORT=3250 mock-provider e2e PASS (90 desktop/mobile tests, 3.4 minutes); formatting PASS; strict specs PASS (20 items).
- Self-review: cookie-derived dataset scope, review/profile/analysis freshness, no inference from null/free text, separate system-structured question context and patient-reported answers, immutable version links, no plan publication, and unchanged ownership boundaries. Desktop and mobile rendered free-text forms inspected; keyboard and serious/critical axe checks are in e2e. No full assistive-technology audit or medical validation claimed.
- The latest follow-up explicitly requests main's existing atomic path; the earlier caller-transition redesign is not mixed into this physician-routing change. No doctor routes, clinical-review internals, analysis internals, database migrations or shared patient contracts changed.
