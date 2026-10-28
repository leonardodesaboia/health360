## Why

Final pre-demo QA for the HISIC demo (2026-11-03) found presenter-visible defects on main after PR #37:

- With `LLM_PROVIDER=openai`, the prepared-starting-point buttons were still offered. Selecting one returned HTTP 500 and the presenter bar said "The demo storage could not be reached". That is the wrong cause and a dead end mid-demo.
- Jordan's case summary showed "Reports a normal colonoscopy on Nov 3, 2022" while the intake and clarification steps ask for that same date ("Unknown stays unknown").
- The physician workspace showed an empty "Information to confirm" warning whenever nothing was missing.

## What Changes

- `/api/demo-session` returns `{ session, preparedStatesAvailable }`. The presenter panel explains that prepared starting points need the mock provider instead of offering buttons that cannot work. The server-side mock-only guard is unchanged.
- Jordan's summary no longer reveals the examination date.
- `InformationGap` renders nothing for an empty list.
- `DEMO_SCRIPT.md`: shortcuts are mock-only, and the date entry follows the browser's field order.

## Capabilities

### Modified Capabilities

- `prepared-demo-starting-points`: presenter availability outside mock mode.

## Impact

QA follow-up, not a backlog task. No clinical rules, analysis, review or publication gates change. No new features.
