# Restricted clinical context and deterministic checks

## ADDED Requirements

### Requirement: Restricted clinical context and deterministic checks

The system SHALL meet the following acceptance contract using synthetic data only:

- deterministic eligibility, contraindication and blocking checks are separate from the LLM.
- evidence IDs/version/source and review status recorded.
- unknown data can block or clarify.
- no broad clinical search/RAG.

#### Scenario: Restricted clinical context and deterministic checks acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** an analysis requests the restricted scenario context
- **THEN** deterministic eligibility, contraindication and blocking checks are separate from the LLM; evidence IDs/version/source and review status recorded; unknown data can block or clarify; no broad clinical search/RAG.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
