# Guided intake, first slice

## ADDED Requirements

### Requirement: Guided intake, first slice

The system SHALL meet the following acceptance contract using synthetic data only:

- configuration-driven steps, back/forward, progress, explicit unknown answers, inline validation, draft save/restore on refresh.
- no overcollection.

#### Scenario: Guided intake, first slice acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** a patient navigates or reloads intake steps
- **THEN** configuration-driven steps, back/forward, progress, explicit unknown answers, inline validation, draft save/restore on refresh; no overcollection.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
