## Boundaries

Pure template selection lives in src/features/clarification. It maps deterministic field paths and known intake missing-information labels to explicit intake fields. Aggregate rule gaps expand to their underlying unknown facts; duplicate facts are asked once. Unsupported paths fail closed rather than generating free-form questions. Existing IntakeField controls provide an explicit I don't know option.

The server reader resolves getDemoSession, locks the patient in inDatasetTransaction and checks the latest profile/analysis/version/status before returning questions and bounded prefilled answers. It never exposes preliminary proposal content. Submission repeats all checks, validates only requested fields, appends a profile/intake/examination snapshot and patient-reported timeline events, and reserves ANALYSIS_PENDING with a fresh analysis ID and profile version. It calls the analysis owner's exported resumeAnalysisForSession(db, session); an interrupted call can resume that stored reservation without another profile. The analysis-owner dependency commit 394b481 is carried unchanged with its original authorship in this PR under explicit orchestrator confirmation; this worker does not modify its internals.

Old forms fail on expected profile/analysis references. Unknown answers remain null and can produce another explicit clarification state. Provider failure preserves saved answers and never creates a plan. The merged physician queue/workspace reader exposes no typed CLARIFY field-request contract; no guessed reader or arbitrary review text is interpreted as a field request.

## Verification plan

Pure tests: supported/unsupported paths, aggregate tri-state gaps, deduplication, bounded input validation, unknown retention and no unrelated edits. PostgreSQL tests: immutable versions, legal workflow, reanalysis invocation, stale/concurrent/repeated submissions, isolation, unsupported fields, failure recovery and no plan publication. Desktop/mobile e2e: answer a missing fact, refresh, persist a new version and rerun real mock-provider analysis; unknown remains clarification-required and prior versions stay unchanged.
