# llm-adapter Specification

## Purpose

Provide replaceable, server-only structured analysis for synthetic demonstrations while retaining mandatory physician review and failing closed on unsafe or unavailable output.

## Requirements

### Requirement: Minimized versioned synthetic requests

The adapter SHALL accept only synthetic input, preserve unknown values, project clinical fields without patient identifiers and retain prompt/profile/context/provider/model metadata locally.

#### Scenario: Profile contains identity fields

- **WHEN** a synthetic profile includes patient identity and unknown age
- **THEN** the provider receives only selected clinical fields with null age and no identity fields

### Requirement: Replaceable structured provider

The adapter SHALL support an explicitly configured OpenAI provider with environment-selected model and a deterministic mock through the same interface, using a versioned safety prompt and strict Zod output contract. The default mock SHALL reproduce only supplied allowed findings with their supplied system-structured rationales and exact rule/evidence scope, without generating new clinical criteria.

#### Scenario: Structured preliminary result

- **WHEN** the provider returns complete supported output
- **THEN** the adapter returns demonstrative AI-generated content needing physician review and never publishes it

#### Scenario: Invalid configuration

- **WHEN** provider, model, key or timeout configuration is invalid
- **THEN** the result is blocked without exposing configuration secrets

#### Scenario: Deterministic mock explains every allowed finding

- **WHEN** an explicit mock request supplies allowed findings and matching versioned system-structured rationale records
- **THEN** the mock returns one preliminary proposal per finding with the supplied rationale and exact category, rule ID and evidence IDs, while preserving unknown information

#### Scenario: Missing or ambiguous mock rationale

- **WHEN** an allowed finding has no unique valid system-structured rationale or its evidence version differs from supplied evidence
- **THEN** mock analysis is blocked without inventing an explanation

#### Scenario: Empty allowed scope

- **WHEN** no findings are allowed but history mentions other rules
- **THEN** the mock returns no proposals and cannot expand scope

### Requirement: Bounded fail-closed validation

The adapter SHALL bound requests and block timeout, API errors, refusals, incomplete or malformed output, unknown or placeholder evidence and proposals outside supplied deterministic scope.

#### Scenario: Provider failure

- **WHEN** a provider hangs, errors or refuses
- **THEN** the result is blocked with a bounded reason and no fallback recommendation

#### Scenario: Unsupported response

- **WHEN** a required field is absent, evidence is unknown or a proposal exceeds supplied scope
- **THEN** the output is blocked without returning raw content

### Requirement: Isolated live smoke

The live smoke check SHALL require an explicit environment flag and SHALL never invoke the API in CI.

#### Scenario: Default test run

- **WHEN** tests run without explicit opt-in or in CI
- **THEN** all provider checks remain deterministic with no live API request
