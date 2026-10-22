# Compare plan versions

## ADDED Requirements

### Requirement: Compare plan versions

The system SHALL meet the following acceptance contract using synthetic data only:

- immutable original text, explicit dates/versions and clinical-review provenance.
- incomplete drafts cannot appear as reviewed changes.

#### Scenario: Compare plan versions acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** two reviewed plan versions are compared
- **THEN** immutable original text, explicit dates/versions and clinical-review provenance; incomplete drafts cannot appear as reviewed changes.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
