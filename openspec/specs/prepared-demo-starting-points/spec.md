# prepared-demo-starting-points Specification

## Purpose

Provide synthetic presentation starting points built by real workflow producers, preserving unknown answers, traceable history and mandatory demonstration physician finalization before publication.

## Requirements

### Requirement: Prepared starting points use real clinical workflow producers

The demo selector SHALL offer synthetic demonstrative prepared states alongside baseline cases. Each state SHALL execute the real intake, analysis and applicable physician review/publication producers, preserve legal append-only workflow history and valid timeline references, and display DEMONSTRATIVE — NOT CLINICALLY VALIDATED labeling through the existing screens.

#### Scenario: Alex and Jordan await physician review

- **WHEN** the presenter selects `alex-review` or `jordan-review`
- **THEN** persisted mock analysis contains respectively PREVENTIVE_OPPORTUNITY or POSSIBLE_REDUNDANCY, with pending physician decisions, no published plan and a review queue entry

#### Scenario: Reviewed plan v1 is ready for reassessment

- **WHEN** the presenter selects `alex-plan-v1`
- **THEN** the real demo physician service explicitly finalizes every decision before publishing plan v1, and the existing patient plan screen can start reassessment

#### Scenario: Failed analysis can retry

- **WHEN** the presenter selects `alex-analysis-failed`
- **THEN** the real analysis producer records a blocked provider failure with no proposals or plan, and a normal mock retry appends a new successful analysis while retaining failure history

#### Scenario: Safe preparation and reset

- **WHEN** preparation unexpectedly fails or a prepared state is reset
- **THEN** failure preserves the previous browser selection, while reset rebuilds the same prepared point through real producers in a fresh isolated dataset without changing other sessions

#### Scenario: Offline and allowlisted

- **WHEN** a prepared state is selected with mock configuration, an unknown ID or an explicitly non-mock provider
- **THEN** mock mode runs offline, while unknown IDs and non-mock configurations are rejected before creating prepared records, without using unknown clinical answers as negatives

### Requirement: Presenter sees prepared-point availability

The system SHALL report whether prepared starting points are available for the configured provider through the uncached presenter state. Outside mock mode it SHALL explain that they require the mock provider instead of offering selections that are rejected.

#### Scenario: Live provider configured

- **WHEN** the server runs with a non-mock `LLM_PROVIDER` and the presenter opens Prepared starting points
- **THEN** no prepared selection is offered, the panel says the mock provider is required, and the server-side rejection of non-mock preparation is unchanged

#### Scenario: Mock provider configured

- **WHEN** the server runs with the mock provider
- **THEN** the presenter state reports prepared starting points as available and the four allowlisted selections are offered
