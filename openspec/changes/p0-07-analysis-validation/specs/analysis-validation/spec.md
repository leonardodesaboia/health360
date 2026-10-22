# Validation and analysis orchestration

## ADDED Requirements

### Requirement: Validation and analysis orchestration

The system SHALL meet the following acceptance contract using synthetic data only:

- malformed/unsupported/unknown-evidence/insufficient results block analysis.
- only validated preliminary proposals enter review queue.
- idempotent retries.
- current versions checked.
- failures publish no plan.

#### Scenario: Validation and analysis orchestration acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** a provider result is received or a failed analysis is retried
- **THEN** malformed/unsupported/unknown-evidence/insufficient results block analysis; only validated preliminary proposals enter review queue; idempotent retries; current versions checked; failures publish no plan.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
