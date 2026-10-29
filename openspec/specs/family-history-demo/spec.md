# family-history-demo Specification

## Purpose

Define the restricted synthetic Daniel family-history screening scenario, nullable patient-reported facts, verified primary evidence and producer-built mock presentation states, while preserving physician review and publication gates.

## Requirements

### Requirement: Source-backed isolated family-history finding

The system SHALL preserve existing average-risk scenarios and use a separate demonstrative context with verified 2017 USMSTF evidence for the family-history scenario. Placeholder evidence SHALL block publication.

#### Scenario: Daniel qualifies

- **WHEN** Daniel is 40, asymptomatic, never screened, without relevant personal or syndromic history, and reports a first-degree relative diagnosed with CRC at 50
- **THEN** the deterministic result is READY_FOR_REVIEW with PREVENTIVE_OPPORTUNITY, rule crc-family-history-early-start and evidence usmstf-crc-family-history-2017; physician review remains mandatory

#### Scenario: Nonqualifying or unknown history

- **WHEN** Daniel has no family history or only second-degree history
- **THEN** no early-start finding appears and age 40 remains OUT_OF_SCOPE

#### Scenario: Missing family facts

- **WHEN** relative degree or diagnosis age is unknown
- **THEN** the result is NEEDS_CLARIFICATION and bounded questions preserve I don't know as unknown

#### Scenario: Outside restricted scope

- **WHEN** symptoms, personal risk or Lynch/FAP history is present
- **THEN** the case stays OUT_OF_SCOPE with no finding or published plan

### Requirement: Nullable patient-reported family facts

The intake SHALL capture first-degree status and youngest diagnosis age as additive nullable facts, show them in the profile, map them into deterministic evaluation and allow typed clarification. Existing familyCrc and familySyndrome semantics SHALL remain unchanged.

#### Scenario: Unknown stays unknown

- **WHEN** the patient chooses I don't know or an older record lacks the new facts
- **THEN** no negative clinical fact is inferred and required facts remain unresolved

### Requirement: Producer-built Daniel prepared states

The demo SHALL provide Daniel baseline selection and mock-only daniel-review and daniel-plan-v1 through real intake, analysis and review producers, with synthetic and demonstrative labeling. The presenter script SHALL explain family-history eligibility separately from the age-45 average-risk criterion.

#### Scenario: Pending review

- **WHEN** daniel-review is selected
- **THEN** /doctor displays Daniel's pending family-history proposal, no plan exists and every persisted transition is legal

#### Scenario: Published demonstration plan

- **WHEN** daniel-plan-v1 is selected
- **THEN** /patient/plan displays reviewed plan v1 after finalized fictional physician review and a legal publication history

#### Scenario: Presenter on desktop and mobile

- **WHEN** the presenter selects Daniel or either prepared state using keyboard or pointer
- **THEN** the selected case and state persist on refresh, labels remain visible, and the page does not overflow
