# Intake completion and clinical profile

## ADDED Requirements

### Requirement: Intake completion and clinical profile

The system SHALL meet the following acceptance contract using synthetic data only:

- user can review/edit answers.
- confirmed submission creates a profile version and completes intake atomically.
- declared/structured/unknown provenance remains distinct.
- duplicate submission does not create duplicate cycles.

#### Scenario: Intake completion and clinical profile acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** a patient confirms reviewed intake answers
- **THEN** user can review/edit answers; confirmed submission creates a profile version and completes intake atomically; declared/structured/unknown provenance remains distinct; duplicate submission does not create duplicate cycles.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
