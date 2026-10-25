## ADDED Requirements

### Requirement: Honest English demonstration script

The presenter script SHALL identify the synthetic, demonstrative scope, required environment, reproducible steps, expected outcomes and incomplete stages. It SHALL distinguish mock verification from a separately authorized live provider check.

#### Scenario: Presenting part 1

- **WHEN** the presenter follows the script
- **THEN** the script uses existing controls and clearly marks physician finalization and clarification stages that are not yet delivered

### Requirement: Implemented browser acceptance journeys

The suite SHALL exercise Flow A through the physician queue, Flow E failure and retry, and Flow D start in both configured desktop/mobile projects. Test fixture setup SHALL be explicit and isolated by demo dataset.

#### Scenario: First evaluation reaches the queue

- **WHEN** the patient confirms a complete synthetic first-screening intake and runs mock analysis
- **THEN** the versioned information survives refresh, preliminary analysis reaches the physician queue and no unreviewed plan becomes available

#### Scenario: Failed analysis is retried

- **WHEN** a real analysis-service call receives a failing mock provider result
- **THEN** the browser shows bounded failure feedback, retry creates one preliminary success while preserving failure history, and no plan is published

#### Scenario: Reassessment begins

- **WHEN** a patient with a fixture-reviewed plan starts updating information
- **THEN** the real reassessment journey begins and the prior reviewed plan remains preserved without claiming a new review or plan

### Requirement: Deferred coverage remains explicit

Unavailable decision/finalization and clarification journeys SHALL be named test.fixme entries with dependency TODOs. Part 1 SHALL NOT claim full P0-14 completion.

#### Scenario: Reporting suite results

- **WHEN** verification results are reported
- **THEN** passed cases and deferred cases are counted separately and the OpenSpec change remains active until remaining acceptance work is complete
