## 1. Validation

- [x] 1.1 Reproduce missing validation failures using shared-contract fixtures.
- [x] 1.2 Implement decision schema and pure completeness/current-version/evidence guards.

## 2. Mutation

- [x] 2.1 Implement session-scoped serialized review save/finalize transactions and timeline events.
- [x] 2.2 Test unauthorized, stale, duplicate, concurrent and rollback paths.
- [x] 2.3 Add server actions and accessible per-proposal decision form with reviewer/version audit details.

- [x] 2.4 Address merged P0-09 review findings with real blocked provenance and populated axe checks.
- [x] 2.5 Store typed CLARIFY requests (question, optional intake targetField) additively in MedicalReview and export listOpenClarificationRequests(db | tx, datasetId, patientId).
- [x] 2.6 Move MEDICAL_REVIEW_PENDING to MEDICAL_REVIEW_IN_PROGRESS when a current review is opened (idempotent, prefetch disabled).
- [x] 2.7 Add a read-only decision history view; label the demo reviewer as not a real clinician.
- [x] 2.8 Hide reader records when a demo case replacement removes the session patient.

## 3. Delivery

- [x] 3.1 Verify meaningful review flows on desktop/mobile and inspect keyboard/error/pending states.
- [x] 3.2 Run full verification and review clinical, security, design and spec boundaries; archive and open separate PR to main.

## Verification in progress (2026-10-25)

- Red: canonical transaction regression failed on the obsolete db.$transaction call. Green after using inDatasetTransaction and the shared lock.
- Red: duplicate canonical source/rule IDs and forged evidence-review flags were accepted. Green after exact canonical core-context comparison.
- Red: real prepareAnalysis BLOCKED provenance test failed with missing analysisPresentation. Green with distinct system/rule attribution and hidden provider metadata; the test proves the model was not called.
- Focused reader/decision/action tests: 32 passed across 5 files.
- PostgreSQL review integration: 5 passed, including concurrent finalization/drafts, complete rollback after plan writes, clarification and stale/foreign rejection.
- Earlier pre-review-fix pnpm verify reached 409 unit passes and a successful production build. The focused browser run was interrupted to integrate required reader findings; it is not claimed complete.
- Full verification on current main and populated-screen browser evidence remain pending.

### Browser and reader-review checkpoint

- pnpm verify on main 9dbcbca plus this task: 418 unit tests passed, one opt-in live-provider test skipped; lint/typecheck and production build passed.
- Focused browser run: 16 of 18 passed, including approval, modification, rejection, clarification, populated queue/workspace serious/critical axe scans on desktop/mobile, and real blocked provenance. The two stale-tab cases exposed native form reset changing the displayed selection after action failure.
- A form reset handler now preserves the controlled draft; browser assertions also check selection retention after successful writes. Focused revalidation is running before full delivery checks.
- The original P0-09 archive now accurately states that its earlier axe scans covered empty/foundation routes; populated-screen scans are explicitly attributed to this follow-up.

### Final verification (2026-10-25, rebased on main 815ca41)

- pnpm verify: lint, strict typecheck, 430 unit tests passed (1 opt-in live-provider test skipped), production build compiled.
- PostgreSQL integration (vitest.integration.config.ts, disposable DB): 11 files, 83 tests passed, including typed CLARIFY round-trip, open/closed clarification requests, single concurrent review opening, finalization to PLAN_AVAILABLE, and reader/opener behavior after demo case replacement (red before the fix, green after).
- pnpm test:e2e on PORT=3220: 84 passed across desktop and mobile, including clarification question entry, decision history, queue status after opening, populated serious/critical axe scans and blocked provenance.
- pnpm format:check and openspec validate --all --strict: passed (19 items).
- Reviews applied inline (no delegated reviewers in this AO session): spec conformance, clinical safety (no publication without explicit finalization, typed physician questions only, demo reviewer labeled not a real clinician), security (server-resolved session, strict client payload, FieldId allowlist) and design tokens/shared primitives. This is engineering review, not medical validation.
