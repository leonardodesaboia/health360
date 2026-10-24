## Why

P0-07 correctly requires every deterministic finding, but the default P0-06 mock always emits an empty proposal list. This blocks the synthetic demo. This follow-up belongs to [P0-06](../../../docs/backlog/IMPLEMENTATION.md#p0-06).

## What Changes

- Make the explicit deterministic mock reproduce only supplied allowed findings using the system-structured rationale records already prepared by P0-07.
- Preserve exact categories, rule/evidence IDs, unknowns and physician-review boundaries; block missing or ambiguous rationale support.
- Keep explicit mock-result overrides for failure tests and no-findings behavior.

## Capabilities

### Modified Capabilities

- `llm-adapter`: deterministic mock response preserves supplied finding scope.

## Impact

Own only MockProvider, its regression tests, adapter documentation and this change. No new clinical rule, provider fallback, publication, persistence, UI or P0-07 orchestration edit. Coordinate the existing minimized history record format with its owner. Run focused and repository verification, review and archive before a new PR to main.
