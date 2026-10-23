# Administrative workflow state

## Purpose

Specify the existing pure graph and independent transition tests in
`src/features/workflow/workflow.ts` and `workflow.test.ts`. This is administrative
adjacency, not authorization, persisted lifecycle or medical approval.

## Requirements

### Requirement: Complete status vocabulary

The workflow SHALL expose exactly NOT_STARTED, INTAKE_IN_PROGRESS, INTAKE_COMPLETED,
ANALYSIS_PENDING, ANALYSIS_FAILED, CLARIFICATION_REQUIRED, MEDICAL_REVIEW_PENDING,
MEDICAL_REVIEW_IN_PROGRESS, MEDICAL_REVIEW_COMPLETED, PLAN_AVAILABLE and
REASSESSMENT_PENDING, each with an English interface label.

#### Scenario: Enumerate workflow labels

- **WHEN** a foundation screen renders any supported administrative state
- **THEN** its exhaustive US English status label SHALL be available without a framework dependency in the graph

### Requirement: Exact legal transition matrix

The pure graph SHALL permit only the following ordered pairs:

#### Scenario: Allowed pair

- **WHEN** canTransition and transition receive any pair listed in the matrix
- **THEN** canTransition SHALL return true and transition SHALL return the target state

| From                       | Allowed next states                                             |
| -------------------------- | --------------------------------------------------------------- |
| NOT_STARTED                | INTAKE_IN_PROGRESS                                              |
| INTAKE_IN_PROGRESS         | INTAKE_COMPLETED                                                |
| INTAKE_COMPLETED           | INTAKE_IN_PROGRESS, ANALYSIS_PENDING                            |
| ANALYSIS_PENDING           | ANALYSIS_FAILED, CLARIFICATION_REQUIRED, MEDICAL_REVIEW_PENDING |
| ANALYSIS_FAILED            | ANALYSIS_PENDING, INTAKE_IN_PROGRESS                            |
| CLARIFICATION_REQUIRED     | ANALYSIS_PENDING                                                |
| MEDICAL_REVIEW_PENDING     | MEDICAL_REVIEW_IN_PROGRESS                                      |
| MEDICAL_REVIEW_IN_PROGRESS | CLARIFICATION_REQUIRED, MEDICAL_REVIEW_COMPLETED                |
| MEDICAL_REVIEW_COMPLETED   | PLAN_AVAILABLE                                                  |
| PLAN_AVAILABLE             | REASSESSMENT_PENDING                                            |
| REASSESSMENT_PENDING       | INTAKE_IN_PROGRESS, ANALYSIS_PENDING                            |

#### Scenario: Forbidden pair including self-transition

- **WHEN** the functions receive any of the other pairs among the 11 supported states
- **THEN** canTransition SHALL return false and transition SHALL throw an Illegal workflow transition error
- **AND** the independent unit specification SHALL cover all 121 pairs

### Requirement: Review and recovery journeys

The graph SHALL retain physician-review adjacency before plan availability, explicit
retry/clarification paths and the reassessment cycle.

#### Scenario: First cycle followed by reassessment

- **WHEN** the pure transition function receives NOT_STARTED → INTAKE_IN_PROGRESS → INTAKE_COMPLETED → ANALYSIS_PENDING → MEDICAL_REVIEW_PENDING → MEDICAL_REVIEW_IN_PROGRESS → MEDICAL_REVIEW_COMPLETED → PLAN_AVAILABLE → REASSESSMENT_PENDING → ANALYSIS_PENDING
- **THEN** every edge SHALL succeed and the final returned state SHALL be ANALYSIS_PENDING

#### Scenario: Failure or clarification retry

- **WHEN** ANALYSIS_FAILED or CLARIFICATION_REQUIRED transitions to ANALYSIS_PENDING
- **THEN** the transition SHALL succeed
- **AND** CLARIFICATION_REQUIRED → PLAN_AVAILABLE SHALL throw

#### Scenario: No authorization implied

- **WHEN** an application caller uses a successful pure transition
- **THEN** that return value SHALL NOT be represented as proof of actor authorization, evidence integrity, current clinical versions or completed physician review
- **AND** current reference screens SHALL NOT invoke transitions to fabricate clinical progress
