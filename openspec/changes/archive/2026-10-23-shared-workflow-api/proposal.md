# Shared persisted workflow API

## Why

The orchestrator requested this narrow prerequisite API because four parallel feature workers need one authoritative state per synthetic patient. This bridges P0-01 persistence to later services; it is not an additional clinical feature.

## What Changes

- Add append-only workflow transitions and the `workflowTransition` repository record kind.
- Expose transaction-compatible status reads and compare-and-transition writes with required actor and optional reason/reference metadata.
- Reject stale, illegal and cross-dataset operations without modifying the existing graph or patient snapshots.

## Capabilities

### New Capabilities

- `persisted-workflow`: scoped administrative status and auditable serialized transitions.

### Modified Capabilities

None. No UI, graph, labels, clinical rules or publication behavior changes.

## Impact

`src/server/workflow/state.ts`, workflow audit contract, DB repository/schema/migration, unit/integration tests and architecture/workflow documentation. P0-02 WIP remains separately committed on its branch. This API does not authenticate actors or prove clinical preconditions.
