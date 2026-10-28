# reviewed-plan Specification

## Purpose

Publish a patient-facing demonstration plan only from a current finalized physician review, atomically and idempotently, and never expose preliminary proposals as a plan.

## Requirements

### Requirement: Finalized current review gates publication

The server SHALL publish only from a session-owned finalized review of the current nonblocked analysis, profile and context, with exactly one complete decision per proposal and valid evidence references.

#### Scenario: Reviewed content is derived exactly

- **WHEN** a current review approves, modifies and rejects proposals
- **THEN** only approved text and modified reviewed text appear in their respective action, redundancy or information sections, with review and profile version links

#### Scenario: Unsafe or unfinished cycles fail closed

- **WHEN** a review is unfinished, pending, requests clarification, has incomplete or duplicate decisions, refers to stale versions, lacks evidence, or belongs to another patient
- **THEN** publication fails without a plan or publication event

### Requirement: Publication is atomic and repeatable

Publication SHALL append an immutable plan and its timeline event with a legal transition to PLAN_AVAILABLE atomically; retrying the same review SHALL return the existing plan without duplicate writes.

#### Scenario: Retry publication

- **WHEN** the same finalized review is published twice
- **THEN** exactly one plan and one publication event exist

### Requirement: Patient route exposes only reviewed plans

The patient plan route SHALL load the selected demo dataset and show only persisted reviewed content, visible demonstrative labeling, action states and review/version provenance.

#### Scenario: No reviewed plan

- **WHEN** a patient opens the route before publication or without a demo session
- **THEN** the page shows an explicit unavailable, review or blocked state and no proposal content
