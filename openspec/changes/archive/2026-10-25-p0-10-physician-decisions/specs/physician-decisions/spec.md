## Purpose

Persist auditable demonstration physician decisions with explicit, current-version finalization and atomic guarded publication, while pending decisions and clarification remain incomplete.

## ADDED Requirements

### Requirement: Auditable per-proposal decisions

The server SHALL persist immutable MedicalReview versions containing one decision per proposal, server-assigned demo reviewer, timestamps and exact analysis version.

#### Scenario: Modified or rejected proposal

- **WHEN** a reviewer modifies or rejects a proposal
- **THEN** a nonblank reason is required and modification also requires revised text

#### Scenario: Unknown actor or record

- **WHEN** no valid demo session exists or the analysis belongs to another patient or dataset
- **THEN** no review or workflow records are written

#### Scenario: Stale concurrent draft

- **WHEN** the client expected review version differs from the stored version
- **THEN** the request fails without overwriting prior decisions

#### Scenario: Typed clarification request

- **WHEN** a reviewer requests clarification for a proposal
- **THEN** a plain-English patient question is required, an optional target must be a known intake field, the draft review stores the typed request, and the workflow moves MEDICAL_REVIEW_IN_PROGRESS to CLARIFICATION_REQUIRED as demo-physician

#### Scenario: Open clarification requests

- **WHEN** a consumer lists open clarification requests for a dataset patient
- **THEN** only typed requests from the incomplete review referenced by the latest demo-physician transition into CLARIFICATION_REQUIRED are returned, and none are returned after analysis resumes or for analysis-originated clarification

### Requirement: Review opening

Opening a current, reviewable workspace SHALL move MEDICAL_REVIEW_PENDING to MEDICAL_REVIEW_IN_PROGRESS through a legal demo-physician transition, at most once.

#### Scenario: Concurrent or repeated opening

- **WHEN** the same current review is opened concurrently or again
- **THEN** exactly one transition is recorded and later openings change nothing

#### Scenario: Stale, foreign or replaced review

- **WHEN** the workspace is stale, belongs to another dataset, or the session patient was replaced
- **THEN** the workflow is unchanged and no records are exposed

### Requirement: Read-only decision history

The workspace SHALL list every saved review version for the analysis, newest first, with decisions, reasons, revised text, clarification questions and a demo reviewer labeled as not a real clinician.

#### Scenario: Saved draft

- **WHEN** a draft or clarification review is saved
- **THEN** the history shows the version as a draft that is not finalized, and it cannot be edited

### Requirement: Explicit atomic completion

Finalization SHALL require a current nonblocked analysis with current profile/context versions, supported evidence, an exact decision set and no PENDING or CLARIFY decisions, and SHALL write review, timeline and legal transition atomically.

#### Scenario: Pending or clarification

- **WHEN** any decision remains pending or asks for clarification
- **THEN** completion is refused and a saved clarification routes to CLARIFICATION_REQUIRED without a completed review

#### Scenario: Finalized review

- **WHEN** all conditions hold and the reviewer explicitly finalizes
- **THEN** an immutable completed review, timeline event and MEDICAL_REVIEW_COMPLETED transition are committed together with guarded publication through the existing plan-owner service, ending in PLAN_AVAILABLE

#### Scenario: Stale, duplicate or failed transaction

- **WHEN** versions changed, review was already finalized, or any transaction write fails
- **THEN** no partial completion is committed and no plan is published
