# Future MVP end-to-end flows

## ADDED Requirements

### Requirement: Flow A — First evaluation (P0-01–11)

The system SHALL support this complete synthetic journey when its dependent capabilities are implemented.

#### Scenario: Flow A end-to-end acceptance

- **GIVEN** the dependent changes have been completed and the prepared synthetic case is reset
- **WHEN** the flow is executed from its initial state through completion or the specified failure
- **THEN** the following acceptance behavior SHALL hold:

Given a reset synthetic case without a plan, when the patient starts intake, enters
the required scenario data/unknown answers, navigates back, edits, confirms and reloads,
then answers persist and a versioned profile exists. When analysis runs, then the
backend loads the chosen versioned context and validates structured output. Patient
plan access remains unavailable. When the physician opens the queue, inspects context
and evidence, records every decision and explicitly finalizes, then a reviewed plan
appears containing only those decisions. Reject direct publication before review.

### Requirement: Flow B — Do Not Test (P0-08–11)

The system SHALL support this complete synthetic journey when its dependent capabilities are implemented.

#### Scenario: Flow B end-to-end acceptance

- **GIVEN** the dependent changes have been completed and the prepared synthetic case is reset
- **WHEN** the flow is executed from its initial state through completion or the specified failure
- **THEN** the following acceptance behavior SHALL hold:

Given a medically specified synthetic prior-exam case, when the deterministic rule
runs, then considered data, rule/version, limitations and possible redundancy are
traceable. When AI explains it, then no evidence outside supplied context appears.
When the physician accepts/modifies/rejects with the required reason, then the
persisted decision and patient plan match. A recent exam in the negative-control
case must not automatically become “unnecessary”. Pending decisions block publication.

### Requirement: Flow C — Clarification (P0-12)

The system SHALL support this complete synthetic journey when its dependent capabilities are implemented.

#### Scenario: Flow C end-to-end acceptance

- **GIVEN** the dependent changes have been completed and the prepared synthetic case is reset
- **WHEN** the flow is executed from its initial state through completion or the specified failure
- **THEN** the following acceptance behavior SHALL hold:

Given essential information is missing, when analysis or review requests a supported
field, then the patient sees a bounded complementary question with “Não sei”. When
answered, then the new profile version persists, a new analysis runs and the prior
analysis cannot be finalized as current. If unknown remains insufficient, then the
case stays explicitly blocked/needs clarification; no fabricated fact or plan appears.

### Requirement: Flow D — Reassessment (P0-13)

The system SHALL support this complete synthetic journey when its dependent capabilities are implemented.

#### Scenario: Flow D end-to-end acceptance

- **GIVEN** the dependent changes have been completed and the prepared synthetic case is reset
- **WHEN** the flow is executed from its initial state through completion or the specified failure
- **THEN** the following acceptance behavior SHALL hold:

Given an existing reviewed plan v1, when the patient updates a relevant fact, then
a new profile version enters reassessment, and plan v1 remains preserved. When a
fresh analysis and physician review finish, then plan v2 links to its current review
and prior plan. Timeline shows both cycles and provenance; reloading or a failed
second analysis cannot overwrite v1 or imply v2 is available.

### Requirement: Flow E — AI failure (P0-07)

The system SHALL support this complete synthetic journey when its dependent capabilities are implemented.

#### Scenario: Flow E end-to-end acceptance

- **GIVEN** the dependent changes have been completed and the prepared synthetic case is reset
- **WHEN** the flow is executed from its initial state through completion or the specified failure
- **THEN** the following acceptance behavior SHALL hold:

Given a completed synthetic intake, when the provider times out, returns malformed
output, an unsupported category, nonexistent evidence or insufficient support, then
analysis is blocked/failed with clear pt-BR feedback and no patient plan/proposal is
published. When the user retries with a valid result, then exactly one current
analysis enters medical review pending. Review remains mandatory. Verify bounded
retry, idempotency, no leaked key/raw output and no fallback recommendation.

These scenarios are future specifications, not skipped tests claimed as passing. Implement under tests/e2e with deterministic adapter stubs; verify live provider integration separately using synthetic data and explicit authorization.
