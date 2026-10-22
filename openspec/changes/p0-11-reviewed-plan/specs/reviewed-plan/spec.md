# Reviewed preventive plan

## ADDED Requirements

### Requirement: Reviewed preventive plan

The system SHALL meet the following acceptance contract using synthetic data only:

- approved/modified actions only.
- reviewed redundancy, pending information, next steps and action states understandable in pt-BR.
- all references trace to the review.
- direct URL/API cannot expose preliminary proposals as a plan.

#### Scenario: Reviewed preventive plan acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** a finalized review is published for the patient
- **THEN** approved/modified actions only; reviewed redundancy, pending information, next steps and action states understandable in pt-BR; all references trace to the review; direct URL/API cannot expose preliminary proposals as a plan.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
