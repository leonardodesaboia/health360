# reassessment-intake Specification

## Purpose

Resume a selected synthetic patient's intake for reassessment while preserving immutable prior versions and showing an honest sessionless entry state.

## Requirements

### Requirement: Resume intake for reassessment

The system SHALL allow the patient to start intake from REASSESSMENT_PENDING, prefill from the latest selected-patient profile version, and append the next immutable version on confirmation.

#### Scenario: Second cycle

- **WHEN** the patient requests reassessment and confirms updated intake
- **THEN** the workflow moves through INTAKE_IN_PROGRESS to INTAKE_COMPLETED and the existing analysis flow accepts the new profile while the prior reviewed plan remains unchanged

### Requirement: Sessionless patient entry

The system SHALL show a case-selection entry state without fixture patient data when no demo session is selected.

#### Scenario: No session

- **WHEN** a visitor opens Patient Home without a demo session
- **THEN** the page asks them to select a demo case and does not show a fixture greeting
