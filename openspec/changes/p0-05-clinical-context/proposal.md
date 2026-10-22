# P0-05 — Restricted clinical context and deterministic checks

Status: planned; **no implementation completed**.

## Why

Load a small versioned demonstrative scenario/context selected by a medical owner.

## What Changes

deterministic eligibility, contraindication and blocking checks are separate from the LLM; evidence IDs/version/source and review status recorded; unknown data can block or clarify; no broad clinical search/RAG.

## Capabilities

### New Capabilities

- `clinical-context`: Restricted clinical context and deterministic checks.

### Modified Capabilities

None. This is a planned addition to the current foundation.

## Impact

future `src/server/clinical-rules`, context fixtures/contracts and scenario docs.

## Dependencies

P0-04; owner-supplied criteria, evidence IDs and expected synthetic outcomes.

## Out of scope

Unrelated MVP modules, real-patient use, autonomous clinical decisions and product section 19 exclusions. This proposal does not authorize execution until assigned.
