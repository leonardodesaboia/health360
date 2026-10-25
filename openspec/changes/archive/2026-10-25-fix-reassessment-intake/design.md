## Decisions

Keep the existing legal workflow edge. startIntake locks the patient inside inDatasetTransaction and permits initial intake or reassessment only. Completion still requires INTAKE_IN_PROGRESS and appends version N+1 atomically. Intake route resolves getDemoSession and reads only its dataset/patient. Latest profile version identifies the corresponding intake answers; older answers never override a newer profile. Browser drafts use dataset, patient and profile version as their key; local reference drafting retains its original key. Submit awaits start to avoid a first-save race. Patient Home returns an entry state without fixture content when no session exists.

## Verification plan

Integration: request reassessment from a reviewed plan, start real intake, prefill, submit changed age, verify N+1, legal state and preserved prior profile/plan. E2E: drive history -> intake -> analysis using the existing analysis action; assert old plan remains readable. Existing desktop/mobile suite covers entry state, keyboard and overflow. No new state or persisted migration is needed.
