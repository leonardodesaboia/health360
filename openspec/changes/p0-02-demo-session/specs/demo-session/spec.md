# Demonstration session and reset

## ADDED Requirements

### Requirement: Demonstration session and reset

The system SHALL meet the following acceptance contract using synthetic data only:

- selected case is consistent in both views.
- reset restores only the current demo dataset.
- visible prototype labels remain.
- role switch grants no real authorization.

#### Scenario: Demonstration session and reset acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** a demonstration case is selected or reset
- **THEN** selected case is consistent in both views; reset restores only the current demo dataset; visible prototype labels remain; role switch grants no real authorization.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
