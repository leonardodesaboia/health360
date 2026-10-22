# Synthetic demonstration mode

## Purpose

Specify existing labeling, role navigation and synthetic-data boundaries in
`src/components/layout/shell.tsx`, patient fixtures and foundation smoke tests.

## Requirements

### Requirement: Explicit prototype labeling

Patient and doctor reference environments SHALL show a visible demonstration
banner identifying synthetic data, lack of clinical validation and exclusion of
real care, with pt-BR interface copy.

#### Scenario: Open any reference route

- **WHEN** a user opens /patient, /patient/intake, /patient/plan, /doctor, /doctor/reviews/demo-review-01 or /showcase
- **THEN** the shell SHALL display Ambiente demonstrativo and synthetic/non-validated context
- **AND** the reference screen SHALL NOT claim a validated medical recommendation

### Requirement: Role switching is navigation only

The demo role link SHALL navigate between patient and doctor environments without
creating authentication or authorization.

#### Scenario: Switch to physician view

- **WHEN** the user follows Ver como médico from the patient environment
- **THEN** the link SHALL navigate to /doctor
- **AND** its accessible name SHALL identify demonstration switching without authorization

#### Scenario: Switch to patient view

- **WHEN** the user follows Ver como paciente from the doctor environment
- **THEN** the link SHALL navigate to /patient
- **AND** no credential, persisted role or clinical authority SHALL be issued

### Requirement: Synthetic references do not simulate completed clinical work

The foundation SHALL use fixed synthetic fixtures, read-only intake, disabled review
decisions and an unavailable plan instead of performing MVP module logic.

#### Scenario: Read the prepared case

- **WHEN** the reference queue/workspace opens Marina Exemplo
- **THEN** the case SHALL remain explicitly fictitious with unknown values preserved
- **AND** no model call, saved decision or generated plan SHALL occur

#### Scenario: Unavailable physician decision

- **WHEN** the synthetic review workspace is displayed
- **THEN** approval/modification/rejection controls SHALL remain disabled with a nearby explanation
- **AND** the patient plan SHALL remain unavailable
