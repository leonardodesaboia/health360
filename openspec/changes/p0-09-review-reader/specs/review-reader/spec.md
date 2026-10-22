# Persisted physician queue and proposal reader

## ADDED Requirements

### Requirement: Persisted physician queue and proposal reader

The system SHALL meet the following acceptance contract using synthetic data only:

- queue shows patient, real analysis timestamp, administrative status and action.
- workspace exposes declared context, proposal category/rationale/criteria, evidence/version, missing data and uncertainty via progressive disclosure.
- actor/record checks on server.

#### Scenario: Persisted physician queue and proposal reader acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** a reviewer opens a current analysis
- **THEN** queue shows patient, real analysis timestamp, administrative status and action; workspace exposes declared context, proposal category/rationale/criteria, evidence/version, missing data and uncertainty via progressive disclosure; actor/record checks on server.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
