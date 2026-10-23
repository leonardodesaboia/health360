## Why

Deliver [P0-03](../../../docs/backlog/IMPLEMENTATION.md#p0-03) for the HISIC demo: a usable guided intake instead of the read-only foundation page.

## What Changes

- Configuration-driven basic information and history steps with explicit unknown answers, conditional details, validation, progress and navigation.
- A versioned draft repository interface with a browser-local synthetic adapter, refresh recovery and visible storage errors.
- English UI and tests. No analysis, recommendations or workflow authorization.

## Capabilities

### New Capabilities

- `intake-draft`: validated synthetic intake drafts and step navigation.

### Modified Capabilities

## Impact

Owns `src/features/health-intake`, the intake route and focused tests. P0-01/P0-02 dependencies are satisfied through existing domain contracts and a replaceable repository interface for this parallel wave; DB/session integration remains dependent on Worker A's merged contract. P0-04 adds completion and profile versioning separately.
