# Implemented foundation

## Purpose

Describe implemented behavior only. The functional MVP is planned in docs/backlog/IMPLEMENTATION.md; per-task changes are created at pickup.

## Requirements

### Requirement: Synthetic reference environments

The application SHALL render the patient home, read-only intake, unavailable-plan page,
physician queue, known synthetic review workspace and component showcase with pt-BR
interface text and explicit demonstration labeling.

#### Scenario: Navigate the synthetic reference screens

- **WHEN** a user follows patient/doctor navigation or opens the showcase
- **THEN** the requested reference screen SHALL render without exposing real data or implying clinical validation
- **AND** role switching SHALL change navigation only, without granting authorization

#### Scenario: Unknown review identifier

- **WHEN** an identifier other than the prepared synthetic review is requested
- **THEN** the application SHALL return HTTP 404 and a pt-BR not-found page

### Requirement: Foundation excludes functional clinical modules

The foundation SHALL use immutable synthetic fixtures and typed contracts without
database access, model calls, persisted decisions, a rules engine or plan generation.

#### Scenario: Review controls and patient plan

- **WHEN** a user opens the reference review workspace or patient plan
- **THEN** decision controls SHALL remain disabled with an explanation and the plan SHALL remain unavailable
- **AND** no unreviewed clinical output SHALL appear as validated patient guidance

### Requirement: Accessible shared UI and verification

The application SHALL use centralized semantic tokens, responsive shared shells,
visible keyboard focus and an accessible non-clinical form example.

#### Scenario: Keyboard and format validation

- **WHEN** a keyboard user activates the first-focus skip link or submits an invalid showcase example
- **THEN** focus SHALL reach main content or the labeled invalid field respectively
- **AND** help/errors SHALL be programmatically connected, with no persistence of the example input

#### Scenario: Production smoke verification

- **WHEN** the foundation verification commands run
- **THEN** lint, strict type checking, workflow/contract unit tests and production build SHALL pass
- **AND** desktop/mobile smoke SHALL check routes, navigation, no page overflow, errors and focus
