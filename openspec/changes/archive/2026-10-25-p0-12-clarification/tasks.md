## Implementation

- [x] 1. Write failing template and answer-validation tests, then implement bounded question selection.
- [x] 2. Implement dataset-scoped reader and immutable versioned answers with stale/unsupported/concurrency guards.
- [x] 3. Integrate exported analysis service and legal transitions; cover PostgreSQL Flow C and failure recovery.
- [x] 4. Add patient clarification UI with unknown/error/pending states and desktop/mobile e2e.
- [x] 5. Run full verification and clinical/design/security/spec self-review; record evidence.

## Verification evidence (2026-10-25)

- TDD: the initial template suite failed because ./questions did not exist; implementation passes five template/answer tests. Four action tests verify cookie-derived scope, stale rejection, actual exported runner invocation order and bounded interrupted-call feedback.
- `pnpm verify`: PASS; six skill-script tests, ESLint, strict TypeScript, 407 unit tests passed, one opt-in live-provider test skipped, production build completed.
- `pnpm test:integration`: PASS; 10 files, 74 PostgreSQL tests on this session's labeled PostgreSQL 17 container, port 5485. Clarification tests cover immutable prior versions, atomic pending reservation, known/unknown reanalysis, concurrent and stale forms, unsupported fields, invalid/unrelated patches and provider timeout with no plan.
- `PORT=3250 LLM_PROVIDER=mock pnpm test:e2e`: PASS; 74 desktop/mobile tests (5.2 minutes), with DATABASE_URL and TEST_DATABASE_URL pointing to the isolated disposable database. Actual Flow C tests cover known/unknown answers, reload, stale tabs, keyboard checkbox focus, interrupted-call recovery, persisted profile/analysis links and no plan exposure.
- The first e2e run had 64 passes and 10 failures: the stale-form alert locator also matched Next's route announcer; it now scopes to main. Physician tests required TEST_DATABASE_URL, now explicitly supplied. The full verify/e2e sequence passed after those corrections.
- `pnpm format:check`: PASS. `pnpm exec openspec validate --all --strict --no-interactive`: PASS (18 items).
- Inline self-review applied spec, clinical, design, security and TypeScript/React checklists. Question templates are bounded; unknowns stay null; current profile/analysis references guard writes; no plan publication or preliminary proposal text enters the form. Shared controls/tokens and explicit loading/error/disabled states are reused. Desktop rendered form and mobile capture inspected; automated mobile/desktop overflow and keyboard coverage pass. No full assistive-technology audit or clinical validation claimed.
- Owner-authored dependency `394b481` is included unchanged, retaining its original authorship, under explicit orchestrator confirmation. This worker did not edit src/server/analysis internals, src/app/doctor or src/server/clinical-review.
- Physician-origin CLARIFY requests remain explicitly unavailable by agreement until P0-10 provides a typed supported-field reader. The current physician queue/workspace reader does not provide one. No real provider call was performed.
