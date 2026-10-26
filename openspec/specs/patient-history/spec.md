# patient-history Specification

## Purpose

Show a patient's linked, versioned event history and preserved reviewed plans, and run reassessment through the full analysis and physician-review cycle without overwriting prior versions.

## Requirements

### Requirement: Linked patient event history

The history SHALL show actual profile, intake, analysis, finalized review and plan publication events in chronological order with provenance and entity versions, scoped to the selected demo dataset and patient.

#### Scenario: Ordered versioned history

- **WHEN** stored events arrive out of order or contain duplicate semantic events
- **THEN** the patient sees one entry per linked entity/version/kind in chronological order, with stable ordering for equal timestamps

#### Scenario: Foreign or unlinked event

- **WHEN** an event belongs to another patient or references an absent entity version
- **THEN** it is not disclosed as part of this patient's history

### Requirement: Preserved reviewed plan versions

Previous plans SHALL remain immutable and readable with publication dates and review/profile provenance; historical URLs SHALL expose only session-owned reviewed content.

#### Scenario: New cycle is unfinished

- **WHEN** reassessment starts or its analysis fails
- **THEN** the prior plan remains readable and identified as previous, without implying a new plan is available

### Requirement: Reassessment uses the full review cycle

New information from PLAN_AVAILABLE SHALL enter REASSESSMENT_PENDING through the canonical workflow service and use the intake producer to save a new profile version and invoke analysis before another physician review and plan publication.

#### Scenario: Start or resume reassessment

- **WHEN** the patient starts updating a current reviewed plan or resumes the same unfinished update
- **THEN** intake opens without overwriting the prior plan or duplicating the reassessment transition

#### Scenario: Stale or cross-patient update

- **WHEN** the submitted plan or profile version is stale or belongs to another patient
- **THEN** the server rejects the request without writing a transition

#### Scenario: Updated information completes a second cycle

- **WHEN** the intake producer saves new information and current analysis and physician review complete
- **THEN** a new profile and reviewed plan version are recorded, with the original plan and both cycles preserved
