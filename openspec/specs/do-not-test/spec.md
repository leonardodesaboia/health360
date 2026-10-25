# do-not-test Specification

## Purpose

Trace preliminary possible-redundancy proposals to the applied demonstrative rule, considered data, limits and evidence, and keep them out of patient views until physician review.

## Requirements

### Requirement: Traceable possible-redundancy proposal

A repeat-screening analysis whose deterministic rule result is POSSIBLE_REDUNDANCY SHALL persist a preliminary proposal carrying the applied rule ID and version, evidence IDs and version, a deterministic rationale, the considered examination data, and the limitation that a recent test alone does not establish redundancy. Rule references SHALL come from the evaluator, never from model output.

#### Scenario: Normal complete adequately prepared colonoscopy within the interval

- **WHEN** a 60-year-old average-risk synthetic patient reports a normal, complete, adequately prepared colonoscopy in 2022 and analysis runs with the mock provider
- **THEN** one POSSIBLE_REDUNDANCY proposal is persisted with rule `crc-routine-repeat` version 1, its evidence, the examination date and result in considered data, and the redundancy limitation, and the workflow reaches MEDICAL_REVIEW_PENDING

#### Scenario: Model-supplied rule metadata

- **WHEN** model output includes rule references or other fields outside the strict output schema
- **THEN** the analysis is blocked as invalid output and contains no proposals

### Requirement: Recent examination alone is insufficient

The redundancy proposal SHALL require all of: a known examination date within the interval, normal result, complete examination, and adequate preparation.

#### Scenario: Unknown examination date

- **WHEN** the colonoscopy date is unknown
- **THEN** no proposal is created and the workflow routes to CLARIFICATION_REQUIRED

#### Scenario: Examination beyond the interval

- **WHEN** the normal colonoscopy is ten or more years old
- **THEN** no POSSIBLE_REDUNDANCY proposal is created

### Requirement: Preliminary until physician review

A possible-redundancy proposal SHALL remain preliminary and SHALL NOT be shown to the patient as advice before physician review.

#### Scenario: Patient status during review

- **WHEN** the redundancy proposal awaits review
- **THEN** the patient analysis reader returns workflow status only, without proposal content
