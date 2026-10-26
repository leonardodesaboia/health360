## Purpose

Provide synthetic presentation starting points built by real workflow producers, preserving unknown answers, traceable history and mandatory demonstration physician finalization before publication.

## ADDED Requirements

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
