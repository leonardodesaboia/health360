## Context

The existing draft slice uses RHF/Zod and an async repository port. The orchestrator approved typed optional intakeFacts (boolean|null for each symptom/risk and colonoscopy quality fact, a screening enum and PATIENT_REPORTED provenance). Worker A's pending P0-02 exposes getDemoSession with datasetId and patientId; server adapters must use datasetRepository(db, session.datasetId).

## Goals / Non-Goals

Complete the configured five-step synthetic intake, preserve unknown facts and immutable versions, and display a consolidated profile. No clinical rule execution, clinical validation, analysis, recommendation or plan publication. Browser-local completion is labeled with its storage limits.

## Decisions

- Configuration/schema owns conditional fields: screening type selects date questions and colonoscopy quality; no screening hides prior exam questions. Approximate year/month stays separate from performedAt, which is null unless exact.
- Pure projection creates HealthProfile, PreviousExamination and completed IntakeResponse together, recording patient-reported answers and system-structured projection separately.
- IntakeDraftRepository.submit(patientId, request) checks expected draft revision and profile version. submissionId makes retries idempotent; reuse with different answers fails. HealthProfileRepository.latest/history reads immutable completed snapshots.
- Browser adapter stores draft and all completion snapshots in one envelope/setItem; Web Locks serialize same-scope cross-tab writes. Existing v1 drafts migrate by adding unanswered new fields, never negative defaults. Server adapter will replace this with dataset-scoped transactions and trusted session identity.
- Review lists visible answers and edit-step actions. Confirmation is explicit. /patient/profile shows no preliminary recommendations and no health score. Dates use en-US.

## Test Mapping

Projection tests prove typed tri-states, unknown date/result, approximate dates and conditional validation. Repository tests prove idempotent retry, concurrent edits, immutable history and no partial save when storage fails. Desktop/mobile Playwright completes, edits, refreshes and reads the saved profile, including keyboard focus, empty and error states.

## Risks / Trade-offs

Local persistence is a temporary demonstrator, not server ownership. P0-02 wiring must not accept a client-provided dataset ID. Profile contract additions are optional and backward compatible; rules mapping to B's aggregate facts belongs to P0-07.
