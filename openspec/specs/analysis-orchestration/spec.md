# analysis-orchestration Specification

## Purpose

Orchestrate dataset-scoped preliminary analysis of the current synthetic profile, validate evidence and category integrity, and fail closed through workflow transitions so no unreviewed proposal reaches patients.

## Requirements

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

### Requirement: Outcome-specific patient guidance

Patient guidance SHALL distinguish stored out-of-scope, deterministic blocked, provider-failure and missing-information outcomes without exposing preliminary proposals. Existing stored facts and a read-only evaluator replay of exact analyzed versions MAY explain historical records. Presentation SHALL NOT change clinical eligibility or publish a plan.

#### Scenario: Out-of-scope information correction

- **WHEN** a saved analysis is out of scope because symptoms, age, risk history, syndrome history or prior test information do not meet demonstration criteria
- **THEN** patient guidance explains the specific recorded reason, labels its provenance and offers Update my information instead of retry
- **AND** correction starts the existing ANALYSIS_FAILED to INTAKE_IN_PROGRESS transition and saves a new profile before another analysis

#### Scenario: Provider failure or missing facts

- **WHEN** the saved result reflects provider failure or missing required information
- **THEN** provider failure retains retry and missing information leads to clarification, with physician review still required before publication
