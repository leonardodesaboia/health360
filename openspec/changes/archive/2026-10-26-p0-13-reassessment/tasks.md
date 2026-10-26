## Implementation

- [x] 1. Write failing timeline projection tests; implement ordering, linked versions, semantic deduplication and patient isolation.
- [x] 2. Add dataset/session-scoped history and historical plan readers plus guarded reassessment entry with stale/repeat/ownership tests.
- [x] 3. Add patient history UI, historical plan pages and navigation using shared design components.
- [x] 4. Integrate persisted intake/profile submission and analysis trigger; verify the second review/plan cycle preserves the original plan.
- [x] 5. Run full verification, desktop/mobile and keyboard checks, self-review, archive, update docs/index and open a PR to main; request AO review and address findings.

## Evidence so far

- TDD: timeline suite first failed with missing `./history`; seven initial tests passed after implementation. All six consolidated timeline kinds from PR #13 now have label/link tests.
- Reassessment regression reproduced a failed-analysis request resolving instead of rejecting; explicit PLAN_AVAILABLE gate added and the test passes.
- Focused Vitest: 4 files, 28 tests passed after adapting to the canonical transaction/dataset workflow API; full producer flow D remains unverified.

## Real-module verification (2026-10-24)

- Rebuilt on verified P0-11 head `4bb6a53` with real demo/session, typed profile and canonical transaction/workflow modules. No runtime stubs remain; no shared contract/migration changes.
- `pnpm verify`: PASS; six skill-script tests, ESLint, strict TypeScript, 315 unit tests (one opt-in live-provider test skipped), production build.
- `pnpm test:integration`: PASS; six files, 45 PostgreSQL tests. New tests prove concurrent reassessment deduplicates its event, old profile/plan payloads remain unchanged, a separately reviewed v2 links v1, and failed reanalysis leaves v1 readable as previous.
- `PORT=3230 pnpm test:e2e`: PASS; 48 desktop/mobile tests, including real session cookies and persisted history, start/resume reassessment, original v1 content and reviewed v2 content. Only synthetic analysis/review producer fixtures are used where the producers remain in flight.
- `pnpm format:check`: PASS. Strict OpenSpec: 13 passed, 0 failed before this evidence-only update.
- Shared PostgreSQL port 5447 was unavailable after the desktop restart. Verification used this session's labeled PostgreSQL 17 container on port 5473; no other worker's process/container was changed.
- Inline clinical/design/security/spec review: patient/dataset boundaries, version links, canonical transition/expected references, unknown-data preservation, reviewed-content gate, all consolidated event labels, semantic deduplication and design tokens inspected. Historical plan notice is accurate after a newer plan is available.
- Rendered two-cycle history inspected at 1440 px desktop and 390 px mobile: both plan versions and event provenance are readable, demonstrative labels stay visible, no horizontal overflow, and keyboard first focus reaches Skip to content.
- Persisted intake submission and live analysis/review producer hookup are still in flight. The synthetic producer fixture proves the second-cycle contracts; the complete live-producer flow D and archive remain outstanding, so task 4 is not checked off.

## Closeout reconciliation (2026-10-26, origin/main 4445499)

- Task 4: the history/restart slice merged in [PR #14](https://github.com/leonardodesaboia/health360/pull/14); real intake resume and analysis trigger in [PR #25](https://github.com/leonardodesaboia/health360/pull/25) ([verified fix](../2026-10-25-fix-reassessment-intake/)); second-cycle finalization and publication through P0-10 ([PR #28](https://github.com/leonardodesaboia/health360/pull/28)).
- The complete live-producer Flow D is now proven by the merged acceptance suite ([PR #33](https://github.com/leonardodesaboia/health360/pull/33), [PR #35](https://github.com/leonardodesaboia/health360/pull/35)): "Flow D completion" runs two real browser review cycles and asserts plan versions 1 and 2 with v1 unchanged and REASSESSMENT_REQUESTED recorded; "Flow D start" asserts v1, analyses and reviews are untouched when reassessment begins. `tests/e2e/history.spec.ts` and `tests/integration/reassessment.test.ts` cover history ordering, stale/cross-patient rejection and failed reanalysis.
- Task 5: verification, desktop/mobile and keyboard checks are recorded above and in the acceptance suite (desktop and mobile projects); archive, index and STATUS updates land in the P0-14 closeout PR with fresh verification.
