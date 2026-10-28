## ADDED Requirements

### Requirement: Presenter sees prepared-point availability

The system SHALL report whether prepared starting points are available for the configured provider through the uncached presenter state. Outside mock mode it SHALL explain that they require the mock provider instead of offering selections that are rejected.

#### Scenario: Live provider configured

- **WHEN** the server runs with a non-mock `LLM_PROVIDER` and the presenter opens Prepared starting points
- **THEN** no prepared selection is offered, the panel says the mock provider is required, and the server-side rejection of non-mock preparation is unchanged

#### Scenario: Mock provider configured

- **WHEN** the server runs with the mock provider
- **THEN** the presenter state reports prepared starting points as available and the four allowlisted selections are offered
