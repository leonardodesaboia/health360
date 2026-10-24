## MODIFIED Requirements

### Requirement: Explicit prototype labeling

Patient and doctor reference environments SHALL show a visible demonstration
banner identifying synthetic data, lack of clinical validation and exclusion of
real care, with US English interface copy.

#### Scenario: Open any reference route

- **WHEN** a user opens /, /patient, /patient/intake, /patient/plan, /doctor, the current case review workspace or /showcase
- **THEN** the page SHALL display Demonstration environment and synthetic/non-validated context
- **AND** the reference screen SHALL NOT claim a validated medical recommendation

### Requirement: Synthetic references do not simulate completed clinical work

The demonstration SHALL use synthetic case records, bounded synthetic intake, disabled review
decisions and an unavailable plan instead of performing MVP module logic.

#### Scenario: Read the prepared case

- **WHEN** the physician queue or review workspace opens the selected demo case
- **THEN** the case SHALL remain explicitly fictitious with unknown values preserved
- **AND** no model call, saved decision or generated plan SHALL occur

#### Scenario: Unavailable physician decision

- **WHEN** the synthetic review workspace is displayed
- **THEN** approval/modification/rejection controls SHALL remain disabled with a nearby explanation
- **AND** the patient plan SHALL remain unavailable
