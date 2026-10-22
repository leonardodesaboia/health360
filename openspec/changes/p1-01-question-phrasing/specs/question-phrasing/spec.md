# AI-assisted question phrasing

## ADDED Requirements

### Requirement: AI-assisted question phrasing

The system SHALL meet the following acceptance contract using synthetic data only:

- model cannot choose new clinical fields or scope.
- template fallback on failure.
- explicit unknown remains possible.

#### Scenario: AI-assisted question phrasing acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** a clarification question is phrased by the model
- **THEN** model cannot choose new clinical fields or scope; template fallback on failure; explicit unknown remains possible.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
