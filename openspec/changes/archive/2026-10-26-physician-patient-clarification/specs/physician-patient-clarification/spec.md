## ADDED Requirements

### Requirement: Answer typed physician clarification requests

The system SHALL display current typed physician CLARIFY questions using bounded known-field inputs or free-text inputs for requests without a target field, with an explicit unknown option.

#### Scenario: Bounded and free-text questions

- **WHEN** a current incomplete review requests supported fields or names no field
- **THEN** the patient sees the physician's questions and can provide bounded answers, free text, or I don't know

#### Scenario: Unsupported named target

- **WHEN** a physician request names an unsupported field
- **THEN** the request remains unavailable and no unrelated answer is saved

### Requirement: Preserve answers and require fresh analysis and review

The system SHALL preserve immutable question/answer versions with patient-reported answer provenance, check current review/profile/analysis references, and rerun the owned analysis service before a new review.

#### Scenario: Answer and review again

- **WHEN** the patient answers current physician questions
- **THEN** a new profile version and sourced answers persist, fresh analysis reaches physician review when supported, and a new review starts without finalizing the earlier review or publishing a plan

#### Scenario: Stale or unknown answers

- **WHEN** a form references a superseded review or an answer is unknown
- **THEN** stale forms write nothing and unknown answers remain null without being inferred into negative facts
