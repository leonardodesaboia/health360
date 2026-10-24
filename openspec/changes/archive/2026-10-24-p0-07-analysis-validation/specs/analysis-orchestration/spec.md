## ADDED Requirements

### Requirement: Deterministic tri-state intake mapping

The service SHALL map the latest session patient's typed intake facts to the evaluator using tri-state OR for symptoms and risk histories. Unknown facts SHALL remain unknown, and colonoscopy quality fields SHALL map directly.

#### Scenario: Mixed known and unknown facts

- **WHEN** a group contains no true values and at least one unknown
- **THEN** its evaluator value is null, while any true yields true and all false yields false

### Requirement: Evidence-constrained preliminary output

The service SHALL run deterministic rules before the provider, minimize transmitted data, parse the shared structured output schema, and reject proposals outside supplied findings or evidence. Physician review SHALL remain mandatory.

#### Scenario: Fabricated or unsupported proposal

- **WHEN** the model supplies an unknown evidence ID, unsupported category, invalid schema, or omits required findings
- **THEN** the analysis is blocked and contains no proposals

#### Scenario: Restricted valid output

- **WHEN** rules and structured output pass integrity checks
- **THEN** preliminary proposals retain deterministic data and limits and enter MEDICAL_REVIEW_PENDING through legal transitions

### Requirement: Dataset-scoped immutable orchestration

The service SHALL bind storage to the active demo session, record profile/context/model/prompt versions and timeline events, and check freshness atomically. It SHALL preserve failed attempts and prevent duplicate successful analyses.

#### Scenario: Unknown required information

- **WHEN** rules require missing information
- **THEN** the service records the gaps and transitions through ANALYSIS_PENDING to CLARIFICATION_REQUIRED without proposals

#### Scenario: Provider failure and retry

- **WHEN** a timeout, API error or invalid response occurs
- **THEN** the service records a blocked analysis, transitions to ANALYSIS_FAILED and permits retry without publishing any plan

#### Scenario: Duplicate or stale request

- **WHEN** a request is duplicated or a newer profile/context appears during a provider call
- **THEN** no duplicate successful analysis or stale proposal is persisted
