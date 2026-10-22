# Prepared demonstration and complete acceptance suite

## ADDED Requirements

### Requirement: Prepared demonstration and complete acceptance suite

The system SHALL meet the following acceptance contract using synthetic data only:

- at least one prepared full case with medically supplied expected outcomes.
- all 18 product acceptance points demonstrated, resettable, with failure/retry path.
- no fake metrics, validation claims or silent success stubs.

#### Scenario: Prepared demonstration and complete acceptance suite acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** a prepared demonstration is executed
- **THEN** at least one prepared full case with medically supplied expected outcomes; all 18 product acceptance points demonstrated, resettable, with failure/retry path; no fake metrics, validation claims or silent success stubs.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
