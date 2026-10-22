# Replaceable server LLM adapter

## ADDED Requirements

### Requirement: Replaceable server LLM adapter

The system SHALL meet the following acceptance contract using synthetic data only:

- server-only secret and minimized synthetic payload.
- versioned prompt/context/profile metadata.
- structured output.
- bounded timeout.
- no chain-of-thought retained.
- provider substitution does not change feature UI.

#### Scenario: Replaceable server LLM adapter acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** the backend calls the configured provider
- **THEN** server-only secret and minimized synthetic payload; versioned prompt/context/profile metadata; structured output; bounded timeout; no chain-of-thought retained; provider substitution does not change feature UI.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
