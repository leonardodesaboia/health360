## Purpose

Provide restricted, versioned synthetic screening scenarios and deterministic checks with explicit unknown handling, traceable evidence and mandatory physician review.

## ADDED Requirements

### Requirement: Bounded versioned demonstrative context

The server SHALL load only supported synthetic scenarios with an explicit available context version. Rules and evidence SHALL include stable IDs, versions, source metadata and demonstrative review status; placeholder evidence SHALL NOT support a finding.

#### Scenario: Unsupported or missing context

- **WHEN** a request names an unsupported scenario or an absent/unavailable context version
- **THEN** evaluation SHALL block without a clinical finding

#### Scenario: Public evidence

- **WHEN** a supported context is loaded
- **THEN** its evidence SHALL identify issuer, title, year, URL and access date without claiming medical review

### Requirement: Deterministic restricted screening checks

The server SHALL evaluate explicit profile facts independently of any LLM and preserve unknown facts. Known exclusions or contradictory records SHALL block routine screening scope; missing required facts SHALL request clarification.

#### Scenario: Never screened

- **WHEN** an asymptomatic synthetic adult aged 45–75 has explicitly absent risk exclusions and no previous screening
- **THEN** the result SHALL contain a preliminary preventive opportunity requiring physician review

#### Scenario: Possible routine repeat redundancy

- **WHEN** the adult has a linked normal complete adequately prepared colonoscopy less than ten calendar years ago and no risk exclusions
- **THEN** the result SHALL flag only possible routine repeat redundancy with traceable limitations

#### Scenario: Negative control

- **WHEN** symptoms, risk factors, abnormal results or inadequate examination quality are present
- **THEN** the routine screening rule SHALL NOT produce a redundancy finding

#### Scenario: Unknown examination date

- **WHEN** the qualifying colonoscopy date is unknown
- **THEN** the result SHALL request that date without inventing an interval or clinical finding

### Requirement: Reviewable demo expectations

The pack SHALL provide synthetic scenario expectations for Flows A–E and immutable reassessment variants without performing persistence, provider calls or publication. Every result SHALL require physician review and deny publication authority.

#### Scenario: Reassessment and provider failure

- **WHEN** new symptoms are introduced or a downstream provider fails
- **THEN** fixtures SHALL expect blocked routine scope or failed analysis respectively, with prior plans preserved and no automatic publication
