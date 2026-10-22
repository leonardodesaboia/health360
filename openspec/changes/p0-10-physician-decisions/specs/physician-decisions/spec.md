# Physician decisions and finalization

## ADDED Requirements

### Requirement: Physician decisions and finalization

The system SHALL meet the following acceptance contract using synthetic data only:

- modify/reject require reason.
- modifications retain revised text.
- reviewer/time/analysis version recorded.
- pending decisions prevent finalization.
- explicit finalization checks current versions and ownership atomically.
- synthetic reviewer is not represented as real clinical validation.

#### Scenario: Physician decisions and finalization acceptance

- **GIVEN** the required dependencies are implemented and an authorized synthetic case is selected
- **WHEN** a reviewer records a decision or finalizes review
- **THEN** modify/reject require reason; modifications retain revised text; reviewer/time/analysis version recorded; pending decisions prevent finalization; explicit finalization checks current versions and ownership atomically; synthetic reviewer is not represented as real clinical validation.

#### Scenario: Clinical boundary remains explicit

- **WHEN** this capability presents or processes health information
- **THEN** the system SHALL preserve synthetic labeling, unknown values and provenance, and SHALL NOT represent unreviewed model output as medically validated patient guidance.
