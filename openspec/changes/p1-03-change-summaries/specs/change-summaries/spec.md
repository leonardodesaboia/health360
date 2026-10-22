# Summaries of changes

## ADDED Requirements

### Requirement: Summaries of changes

The system SHALL meet the following acceptance contract using synthetic data only:

- no new medical conclusion.
- every statement grounded in supplied diff.
- unavailable state on failure.
- physician/patient wording separated.

#### Scenario: Summaries of changes acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** a summary is requested for a structured version difference
- **THEN** no new medical conclusion; every statement grounded in supplied diff; unavailable state on failure; physician/patient wording separated.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
