# P0-09 — Persisted physician queue and proposal reader

Status: planned; **no implementation completed**.

## Why

Replace the static queue/workspace data with current versioned synthetic analyses.

## What Changes

queue shows patient, real analysis timestamp, administrative status and action; workspace exposes declared context, proposal category/rationale/criteria, evidence/version, missing data and uncertainty via progressive disclosure; actor/record checks on server.

## Capabilities

### New Capabilities

- `review-reader`: Persisted physician queue and proposal reader.

### Modified Capabilities

None. This is a planned addition to the current foundation.

## Impact

clinical-review feature, `/doctor`, `/doctor/reviews/[reviewId]`, shared evidence/proposal components.

## Dependencies

P0-07, P0-08.

## Out of scope

Unrelated MVP modules, real-patient use, autonomous clinical decisions and product section 19 exclusions. This proposal does not authorize execution until assigned.
