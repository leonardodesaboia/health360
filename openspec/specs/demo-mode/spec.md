# Synthetic demonstration mode

## Purpose

Specify existing labeling, role navigation and synthetic-data boundaries in
`src/components/layout/shell.tsx`, patient fixtures and foundation smoke tests.

## Requirements

### Requirement: Explicit prototype labeling

Patient and doctor reference environments SHALL show a visible demonstration
banner identifying synthetic data, lack of clinical validation and exclusion of
real care, with US English interface copy.

#### Scenario: Open any reference route

- **WHEN** a user opens /, /patient, /patient/intake, /patient/plan, /doctor, the current case review workspace or /showcase
- **THEN** the page SHALL display Demonstration environment and synthetic/non-validated context
- **AND** the reference screen SHALL NOT claim a validated medical recommendation

### Requirement: Role switching is navigation only

The demo role link SHALL navigate between patient and doctor environments without
creating authentication or authorization.

#### Scenario: Switch to physician view

- **WHEN** the user follows View as physician from the patient environment
- **THEN** the link SHALL navigate to /doctor
- **AND** its accessible name SHALL identify demonstration switching without authorization

#### Scenario: Switch to patient view

- **WHEN** the user follows View as patient from the doctor environment
- **THEN** the link SHALL navigate to /patient
- **AND** no credential, persisted role or clinical authority SHALL be issued
