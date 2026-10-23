# intake-draft Specification

## Purpose

Collect and recover scoped synthetic intake drafts with explicit unknown values, accessible step navigation and visible persistence failures.

## Requirements

### Requirement: Guided synthetic draft collection

The intake SHALL provide configuration-driven basic information and history steps with progress, back/next navigation, inline validation and explicit unknown answers.

#### Scenario: Unknown history

- **WHEN** the user selects "I don't know" for a history question
- **THEN** the draft retains null rather than a negative answer and does not require conditional details

#### Scenario: Declared history

- **WHEN** history is declared present without details
- **THEN** progression is blocked with an associated inline error

### Requirement: Recoverable scoped draft persistence

Drafts SHALL be schema-validated and revision-checked through a replaceable repository interface, with storage failures visible and recoverable.

#### Scenario: Refresh recovery

- **WHEN** a synthetic draft is saved and the page refreshes
- **THEN** the same answers and current step are restored

#### Scenario: Stale or invalid storage

- **WHEN** stored data is malformed or a save uses a stale revision
- **THEN** the operation fails visibly without overwriting the existing draft
