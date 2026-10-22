# Deterministic clarification loop

## ADDED Requirements

### Requirement: Deterministic clarification loop

The system SHALL meet the following acceptance contract using synthetic data only:

- restricted question templates selected by required gaps.
- explicit “Não sei”.
- persisted answer creates a profile version and re-enters analysis.
- unresolved unknowns remain blocked where required.
- review-origin clarification invalidates stale proposals.

#### Scenario: Deterministic clarification loop acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** an essential field is requested and the patient answers
- **THEN** restricted question templates selected by required gaps; explicit “Não sei”; persisted answer creates a profile version and re-enters analysis; unresolved unknowns remain blocked where required; review-origin clarification invalidates stale proposals.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
