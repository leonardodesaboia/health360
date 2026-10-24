## Why

[P0-09](../../../docs/backlog/IMPLEMENTATION.md#p0-09) needs a physician reader for persisted, dataset-scoped analyses before the HISIC demonstration. The wave-2 brief authorizes contract fixtures while upstream producers are in flight.

## What Changes

- Replace static physician queue and workspace with server-loaded dataset records.
- Show versioned context, unknown information, preliminary proposals, criteria, evidence and uncertainty.
- Return no records without a demo session and reject foreign workspace IDs.
- Keep decisions out of this reader task (P0-10 follows).

## Capabilities

### New Capabilities

- `physician-reader`: scoped queue and versioned analysis reader.

### Modified Capabilities

## Impact

Physician routes, a clinical-review feature, a server reader and corresponding unit/e2e tests. No writes or clinical rules are introduced.
