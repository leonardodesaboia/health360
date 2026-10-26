## Boundaries and data

Keep DemoCaseId limited to the canonical first-screening/repeat-screening clinical scenarios. Add a separate prepared-state ID mapping to the base case, label and existing destination. Store the prepared selection in dataset metadata while resolving session.caseId to the base scenario for canonical context validation. Existing baseline contracts remain compatible.

Explicit fictional intake answers cover all visible fields: age and negative symptom/risk answers authored for these scenarios, medications None, smoking no, activity yes, and Jordan's exact 2022-11-03 normal/complete/adequately prepared colonoscopy. This authors scenario inputs; it never turns absent answers into negative defaults. Irrelevant examination fields remain null for Alex.

## Producer sequence

Seed baseline case -> startIntake -> completeIntake -> runAnalysisForSession with mock -> for plan v1, recordReview with explicit APPROVE/finalize using the produced proposal IDs. Review states stop before a physician decision. Per the orchestrator's explicit decision, Flow E uses the existing analyzeSession producer with a scoped failing MockProvider (api_error), followed by normal runAnalysisForSession on retry. The shared runner API remains unchanged. Never mutate process.env per request.

## Failure, scope and reset

Prepared selections are built in a new random cookie-derived dataset. The previous browser selection remains intact until all required producers complete. On unexpected failure, delete only the newly allocated dataset and leave the cookie untouched. Reset a prepared state into another fresh dataset through the same sequence; never reuse an active dataset across multiple independently committed producers. Base case selection/reset behavior remains unchanged. Existing datasets are retained, as with clearing demo cookies; no cross-session deletion or authorization inference.

The selector sends only an allowlisted state ID. Server code owns dataset, patient, provider and destination decisions. Prepared mode refuses an explicitly non-mock provider before writing. The app action navigates to the existing physician queue, patient plan or retry screen; no clinical page changes.

The action returns its allowlisted destination. The client refreshes session metadata before navigating, avoiding caught redirect control-flow errors. A native disclosure contains existing PendingButton actions and marks the activated state with aria-pressed. It keeps presenter controls distinct from intake comboboxes and preserves the merged acceptance helpers without changing their files. The upstream physician UX spacing is preserved.

## Verification

- DB tests first: legal contiguous append-only histories, canonical evidence references, real intake/profile/analysis versions, pending proposals, actual finalized review and plan v1, failure history followed by successful retry, reset isolation and failed preparation preserving the previous selection.
- Read the real physician queue/patient-plan models from persisted records; browser tests outside acceptance verify the existing screens render after selection and reset.
- Unit tests: allowlisted IDs/labels and explicit typed scenario inputs, baseline behavior unchanged, no openai request from prepared mode.
- Full verify, integration, desktop/mobile e2e, formatting, strict OpenSpec validation; inline spec/TypeScript/design/clinical review; archive this scoped change without claiming full P0-14 acceptance delivery or editing another owner's checklist.
