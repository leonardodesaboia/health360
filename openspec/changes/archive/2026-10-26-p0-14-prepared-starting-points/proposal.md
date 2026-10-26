## Why

[P0-14](../../../docs/backlog/IMPLEMENTATION.md#p0-14), part 2, needs reproducible synthetic starting points so presenters can reach review, reassessment and retry without completing every preceding form live. This change is limited to the seed/selector lane; acceptance scripts and patient/physician pages belong to other owners.

## What Changes

- Add `alex-review`, `jordan-review`, `alex-plan-v1` and `alex-analysis-failed` starting points alongside the existing baseline cases.
- Run real intake, mock analysis and demo physician finalization producers in order; never insert workflow, analysis, review or plan snapshots as a shortcut.
- Prepare in a fresh dataset and set the browser cookie only after success; preserve the prior selection on unexpected failure.
- Provide selector controls and route presenters to the corresponding existing screen. Reset rebuilds the selected prepared point through the same producers.

## Capabilities

### New Capabilities

- `prepared-demo-starting-points`: producer-built synthetic presentation states.

### Modified Capabilities

None.

## Impact

Demo server modules, selector controls/actions/API, and their tests. No patient/physician page edits, acceptance-suite edits, demo-script edits, schema migrations or clinical criteria changes. Existing producer APIs are dependencies; the Flow E failure seam is coordinated with the orchestrator. All content stays demonstrative, mock-only and synthetic, with no real medical validation claim.
