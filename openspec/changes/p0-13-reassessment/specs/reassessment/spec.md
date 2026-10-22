# Longitudinal history and reassessment

## ADDED Requirements

### Requirement: Longitudinal history and reassessment

The system SHALL meet the following acceptance contract using synthetic data only:

- profile/intake/analysis/review/publication events with provenance/version.
- new data enters REASSESSMENT_PENDING.
- reanalysis and review create a new plan.
- old plan remains identified as previous and readable.
- no predictive twin.

#### Scenario: Longitudinal history and reassessment acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** a patient updates information after a previous plan
- **THEN** profile/intake/analysis/review/publication events with provenance/version; new data enters REASSESSMENT_PENDING; reanalysis and review create a new plan; old plan remains identified as previous and readable; no predictive twin.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
