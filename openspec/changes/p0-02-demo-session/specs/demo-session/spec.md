## ADDED Requirements

### Requirement: Per-browser synthetic case selection

The demonstration SHALL let a presenter select one prepared synthetic case (`first-screening` or `repeat-screening`) and SHALL store it in a dataset bound to an opaque httpOnly cookie. A demo session SHALL NOT grant identity or authorization.

#### Scenario: Select a case

- **WHEN** a presenter selects a prepared case from the selector
- **THEN** the patient home, physician queue and review workspace SHALL show the same stored synthetic patient
- **AND** the stored patient SHALL be `NOT_STARTED` with no analysis, review or plan records

#### Scenario: Refresh and navigate

- **WHEN** the presenter reloads a page or switches between patient and physician views
- **THEN** the same selected case SHALL remain visible

#### Scenario: Invalid case ID

- **WHEN** a selection submits an ID outside the prepared cases
- **THEN** it SHALL be rejected before any write and the current dataset SHALL remain unchanged

#### Scenario: No or invalid session

- **WHEN** a request has no cookie, a malformed cookie or a cookie for a missing dataset
- **THEN** the views SHALL show an empty state linking to the selector without writing data

### Requirement: Scoped idempotent reset

Reset SHALL restore the current session's prepared case and SHALL NOT affect another session's dataset.

#### Scenario: Reset twice

- **WHEN** reset runs twice for the same session
- **THEN** the dataset SHALL contain identical prepared records both times

#### Scenario: Another session exists

- **WHEN** one session resets or switches case
- **THEN** every other session's records SHALL remain unchanged

### Requirement: Case-scoped review workspace

The review workspace SHALL render only the current session's case.

#### Scenario: Another case review ID

- **WHEN** a review ID does not match the current session's case
- **THEN** the route SHALL return not found without disclosing another case

### Requirement: Versioned case context snapshot

Selection and reset SHALL persist the canonical P0-05 context with its version, rule IDs, evidence metadata and demonstrative labels. Session reads SHALL expose the stored clinicalContext and its id/version for analysis references.

#### Scenario: Selected case context

- **WHEN** a prepared case is selected or reset
- **THEN** its dataset SHALL contain exactly one canonical context snapshot of version 1
- **AND** an analysis SHALL be able to reference that dataset-scoped context without creating or publishing any recommendation during selection
