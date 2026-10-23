## MODIFIED Requirements

### Requirement: Complete status vocabulary

The workflow SHALL expose exactly NOT_STARTED, INTAKE_IN_PROGRESS, INTAKE_COMPLETED,
ANALYSIS_PENDING, ANALYSIS_FAILED, CLARIFICATION_REQUIRED, MEDICAL_REVIEW_PENDING,
MEDICAL_REVIEW_IN_PROGRESS, MEDICAL_REVIEW_COMPLETED, PLAN_AVAILABLE and
REASSESSMENT_PENDING, each with an English interface label.

#### Scenario: Enumerate workflow labels

- **WHEN** a foundation screen renders any supported administrative state
- **THEN** its exhaustive US English status label SHALL be available without a framework dependency in the graph
