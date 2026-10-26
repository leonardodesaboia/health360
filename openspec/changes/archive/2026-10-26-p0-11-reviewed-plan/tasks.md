## Implementation

- [x] 1. Add failing derivation tests for complete decisions, modifications, rejection, pending/clarification, evidence, ownership and stale cycles; implement the pure guard and builder.
- [x] 2. Implement dataset-scoped atomic publication and legal workflow transition with idempotence and service regression tests.
- [x] 3. Replace static plan route with persisted reviewed content and explicit unavailable/error states; add desktop/mobile e2e coverage.
- [x] 4. Run full verification and responsive/keyboard checks; self-review clinical, design, security and spec conformance; record real evidence.
- [x] 5. Archive the implemented change, update canonical docs/index, and open a PR to protected main; request AO review and address findings.

## Closeout reconciliation (2026-10-26, origin/main 4445499)

- The publisher and patient route merged in [PR #11](https://github.com/leonardodesaboia/health360/pull/11). The producer gap noted above is closed: P0-10 finalization ([PR #28](https://github.com/leonardodesaboia/health360/pull/28)) calls `publishReviewedPlan` inside its finalization transaction (`src/server/clinical-review/decisions.ts`).
- Live-producer flows A/B are now proven through real browser controls by the merged acceptance suite ([PR #33](https://github.com/leonardodesaboia/health360/pull/33), [PR #35](https://github.com/leonardodesaboia/health360/pull/35)): "Flow A completion" publishes plan v1 with only approved wording; "Flow B completion" publishes only the physician's modified wording. Rejection exclusion is covered in `tests/e2e/physician-decisions.spec.ts` (fixture-seeded review, real decision UI) and `tests/integration/reviewed-plan.test.ts`.
- Archive, index and STATUS updates land in the P0-14 closeout PR; fresh verification is recorded there.

## Verification evidence (2026-10-24)

- TDD: focused derivation test initially failed with missing `./build`; implementation then passed 23 derivation cases.
- Real demo/session and canonical workflow modules are integrated from main. No runtime stubs remain.
- `pnpm verify`: PASS; skill checks, six script tests, ESLint, strict typecheck, 287 unit tests passed (one opt-in live-provider test skipped), production build passed.
- `pnpm test:integration`: PASS; 5 files, 43 PostgreSQL tests, including concurrent idempotent publication and containing-transaction rollback. Tests use only isolated synthetic datasets in `health360_tests`.
- `PORT=3230 pnpm test:e2e`: PASS; 42 desktop/mobile tests. Persisted finalized/unfinished MedicalReview and AIAnalysis producer fixtures exercise real session cookies, database reads, reviewed text, rejected-text exclusion, refresh persistence and no overflow. Fixture subprocesses are asynchronous with bounded timeouts; no production publication gate changed.
- `pnpm format:check`: PASS after the final test-only edit.
- Strict OpenSpec validation: 12 passed, 0 failed before this final evidence-only update.
- Inline review: publication ownership, current profile/analysis/context/review references, evidence source integrity, fail-closed states, immutable history, server-only boundaries and design tokens inspected. No clinical validation is claimed.
- Rendered reviewed-plan screenshots inspected at 1440 px desktop and 390 px mobile: readable sections, visible demonstrative labels, no horizontal overflow; keyboard first focus reaches Skip to content. AO Browser preview timed out, so this inspection used isolated Playwright screenshots. AO native review follows the push.
- The P0-10 finalization producer is still in flight. Its transaction must call `publishReviewedPlan(tx, datasetId, patientId, reviewId)` after MEDICAL_REVIEW_COMPLETED. Synthetic producer fixtures are used as authorized; complete live producer flows A/B and archive remain unverified.
