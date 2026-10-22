# Synthetic persistence and version boundaries

## ADDED Requirements

### Requirement: Synthetic persistence and version boundaries

The system SHALL meet the following acceptance contract using synthetic data only:

- synthetic seeds only.
- stable IDs/foreign keys.
- review/analysis/profile/context version links.
- previous versions cannot be silently overwritten.
- no clinical data in logs.

#### Scenario: Synthetic persistence and version boundaries acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** a synthetic record is saved or revised
- **THEN** synthetic seeds only; stable IDs/foreign keys; review/analysis/profile/context version links; previous versions cannot be silently overwritten; no clinical data in logs.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
