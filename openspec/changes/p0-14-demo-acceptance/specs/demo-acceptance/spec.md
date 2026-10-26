## ADDED Requirements

### Requirement: Honest English demonstration script

The presenter script SHALL identify the synthetic, demonstrative scope, required environment, reproducible steps, expected outcomes and incomplete stages. It SHALL distinguish mock verification from a separately authorized live provider check.

#### Scenario: Presenting part 1

- **WHEN** the presenter follows the script
- **THEN** the script uses only implemented controls, states the synthetic, demonstrative and physician-review limits, and names the mock-provider fallback

### Requirement: Implemented browser acceptance journeys

The suite SHALL exercise Flows A–E in both configured desktop/mobile projects, including the physician queue and workspace with rule and evidence traceability. Test fixture setup SHALL be explicit and isolated by demo dataset.

#### Scenario: First evaluation reaches the queue

- **WHEN** the patient confirms a complete synthetic first-screening intake and runs mock analysis
- **THEN** the versioned information survives refresh, preliminary analysis reaches the physician queue and no unreviewed plan becomes available

#### Scenario: Unknown answer is clarified

- **WHEN** a patient completes intake with an unknown age, runs analysis and answers the clarification question with a value or with I don't know
- **THEN** a new immutable profile version is recorded, analysis re-runs from CLARIFICATION_REQUIRED, a known answer reaches the physician queue, an unknown answer returns to clarification, and no plan is published

#### Scenario: Failed analysis is retried

- **WHEN** a real analysis-service call receives a failing mock provider result
- **THEN** the browser shows bounded failure feedback, retry creates one preliminary success while preserving failure history, and no plan is published

#### Scenario: Reassessment begins

- **WHEN** a patient with a fixture-reviewed plan starts updating information
- **THEN** the real reassessment journey begins and the prior reviewed plan remains preserved without claiming a new review or plan

### Requirement: Complete A–E journeys

The suite SHALL cover physician decisions and finalization (Flow A approval, Flow B modification) and a full second review cycle (Flow D) through real browser controls, publishing only reviewed content.

#### Scenario: Physician finalization publishes only reviewed content

- **WHEN** the physician approves or modifies the preliminary proposal and finalizes the review
- **THEN** the patient plan shows only the reviewed content, a modified proposal shows only the physician's revised wording, and no model title or rule identifier is shown to the patient

#### Scenario: Second cycle preserves the first plan

- **WHEN** the patient updates information after plan v1 and the new analysis is reviewed and finalized
- **THEN** plan v2 is published and plan v1 remains available in history
