# Do Not Test slice

## ADDED Requirements

### Requirement: Do Not Test slice

The system SHALL meet the following acceptance contract using synthetic data only:

- records examination data, applied rule ID/version, rationale and limitations.
- recent examination alone is insufficient.
- AI explains supplied rule result.
- remains preliminary until reviewed.

#### Scenario: Do Not Test slice acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** a prior examination is evaluated by the supplied rule
- **THEN** records examination data, applied rule ID/version, rationale and limitations; recent examination alone is insufficient; AI explains supplied rule result; remains preliminary until reviewed.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
