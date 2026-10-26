# demo-seed-intake-facts Specification

## Purpose

Provide complete typed synthetic case snapshots so demo analysis uses explicit patient-reported facts while preserving unknown answers and physician review gates.

## Requirements

### Requirement: Selected synthetic cases include typed intake facts

Demo selection and reset SHALL persist complete patient-reported intakeFacts using the shared nullable contract, without inferring negative facts from unknown input or narrative text. Scenarios SHALL remain synthetic and demonstrative, with the existing DEMONSTRATIVE — NOT CLINICALLY VALIDATED labels and mandatory physician review.

#### Scenario: First screening

- **WHEN** Alex is selected and the normal intake workflow completes without changing seeded facts
- **THEN** mock analysis produces a preliminary PREVENTIVE_OPPORTUNITY for screening due, with NEVER_SCREENED and null colonoscopy quality facts

#### Scenario: Repeat screening

- **WHEN** Jordan is selected and the normal intake workflow completes without changing seeded facts
- **THEN** mock analysis produces a preliminary POSSIBLE_REDUNDANCY for the normal complete adequately prepared 2022 colonoscopy, without publishing a plan

#### Scenario: Intentional uncertainty and symptoms

- **WHEN** the unknown-date or new-symptoms scenario variant is evaluated from its typed profile
- **THEN** it respectively requires clarification or remains out of scope without a recommendation

#### Scenario: Unknown answers

- **WHEN** an authored answer is null
- **THEN** storage preserves null and analysis never treats it as a negative answer
