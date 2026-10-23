## Why

Deliver [P0-04](../../../docs/backlog/IMPLEMENTATION.md#p0-04): complete the synthetic intake and create a versioned consolidated profile for the HISIC demonstration.

## What Changes

- Add medications, minimal habits, previous screening/exam details, review/edit and explicit confirmation.
- Preserve unknown answers and exact versus approximate dates without inventing dates.
- Add optional typed HealthProfile.intakeFacts approved by the orchestrator; existing arrays remain compatible.
- Extend the async intake port with idempotent atomic submit and add latest/history profile reads. Browser-local adapter until the P0-02 session contract merges; database wiring must use the trusted session dataset ID.
- Add /patient/profile showing declared, structured and unknown information, version and last updated date; no scores or advice.

## Capabilities

### New Capabilities

- `clinical-profile`: confirmed intake completion and immutable synthetic profile versions.

### Modified Capabilities

## Impact

Owns intake/profile features, patient contracts and routes, focused tests and P0-04 bookkeeping. P0-03 is merged in PR #9; P0-01 is merged. P0-02 is satisfied via its published server-session contract for parallel development; initial adapter remains browser-local until that implementation lands. No analysis, AI calls, physician decisions or plan publication.
