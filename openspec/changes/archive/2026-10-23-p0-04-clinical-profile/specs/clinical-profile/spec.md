## Purpose

Complete synthetic intake through explicit confirmation and consolidate immutable profile versions with visible provenance and unknown information.

## ADDED Requirements

### Requirement: Conditional reviewable intake completion

The intake SHALL collect minimal habits, medications and prior screening details, allow explicit unknown values, and provide review/edit and explicit confirmation before completion.

#### Scenario: Unknown or approximate examination date

- **WHEN** an examination date is unknown or approximate
- **THEN** no exact performedAt date is invented and the uncertainty remains visible

#### Scenario: Review and edit

- **WHEN** the user edits answers from review
- **THEN** the changed answers appear in the confirmed profile

### Requirement: Immutable atomic profile creation

Confirmation SHALL create one immutable profile version and completed intake together, preserving typed patient-reported facts and system-structured provenance. Duplicate submissions SHALL be idempotent and stale edits SHALL fail without overwriting data.

This slice SHALL use a replaceable repository port with an explicitly labeled browser-local adapter until dataset-scoped server integration is available.

#### Scenario: Repeat confirmation

- **WHEN** the same submission ID and answers are retried
- **THEN** the existing profile version is returned without another completion

#### Scenario: Concurrent edits

- **WHEN** a confirmation uses stale draft or profile versions
- **THEN** it is rejected and previous versions remain unchanged

### Requirement: Consolidated profile display

The profile SHALL show declared answers, structured profile version, unknown information, previous examinations and last updated date without scores or medical approval claims.

#### Scenario: No profile yet

- **WHEN** no confirmed profile exists
- **THEN** an empty state links to intake

#### Scenario: Confirmed profile with unknown facts

- **WHEN** the profile contains unknown answers
- **THEN** they are labeled unknown and remain separate from declared negative facts
