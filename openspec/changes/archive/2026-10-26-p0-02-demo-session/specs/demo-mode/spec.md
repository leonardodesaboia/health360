## MODIFIED Requirements

### Requirement: Explicit prototype labeling

Patient and doctor reference environments SHALL show a visible demonstration
banner identifying synthetic data, lack of clinical validation and exclusion of
real care, with US English interface copy.

#### Scenario: Open any reference route

- **WHEN** a user opens /, /patient, /patient/intake, /patient/plan, /doctor, the current case review workspace or /showcase
- **THEN** the page SHALL display Demonstration environment and synthetic/non-validated context
- **AND** the reference screen SHALL NOT claim a validated medical recommendation

## REMOVED Requirements

### Requirement: Synthetic references do not simulate completed clinical work

**Reason**: Superseded. The fixed Marina reference fixture with disabled decisions and an always-unavailable plan was replaced by the selected demo session (this change), real physician decisions and finalization (P0-10, PR #28) and guarded reviewed-plan publication (P0-11, PR #11).

**Migration**: Use `demo-session` for case selection and reset, `physician-decisions` for decision and finalization gates and `reviewed-plan` for patient publication boundaries. Synthetic labeling remains under Explicit prototype labeling.
