# patient-clarification Specification

## Purpose

Collect bounded missing-information answers for the selected synthetic patient, preserve immutable versions and unknowns, and rerun preliminary analysis through the owned analysis service.

## Requirements

### Requirement: Bounded missing-information questions

The system SHALL ask plain-English questions selected from supported missing fields on the latest current analysis, with an explicit unknown option for every answer.

#### Scenario: Supported gap

- **WHEN** the current analysis requests supported missing facts
- **THEN** the patient sees bounded questions for those facts without preliminary proposals

#### Scenario: Unsupported field

- **WHEN** a missing field has no supported template
- **THEN** the system explains that clarification is unavailable and does not accept a fabricated or unrelated answer

### Requirement: Versioned answers and fresh analysis

The system SHALL preserve previous profiles and analyses, persist answers as a new patient-reported profile version, and use the exported analysis service to return through ANALYSIS_PENDING before fresh analysis.

#### Scenario: Answered gap

- **WHEN** the patient submits current supported answers
- **THEN** a new immutable profile and answer event are recorded and fresh analysis runs without publishing a plan

#### Scenario: Unknown remains insufficient

- **WHEN** the patient answers I don't know and the information remains required
- **THEN** the stored value remains unknown and analysis stays blocked or clarification-required

#### Scenario: Stale or foreign submission

- **WHEN** the expected profile or analysis is stale or belongs to another dataset or patient
- **THEN** the submission creates no profile, analysis or plan

#### Scenario: Refresh or provider failure

- **WHEN** the patient refreshes or reanalysis fails after answers were saved
- **THEN** saved versions remain available with an explicit recoverable status and no fallback plan
