## Plan

1. Update the foundation, demo-mode and workflow-state language contracts through delta specs.
2. Add a failing English status/fixture/formatting regression and update existing browser assertions before translating runtime copy.
3. Translate existing routes, shared components, fixtures and status labels. Use explicit en-US Intl formatting; keep ISO timestamps as data and use English HTML language metadata.
4. Translate the complete product context without dropping future requirements; update canonical guidance, examples, specs and skills, then sync portable copies. Record ADR0004.
5. Run focused tests, full verification, desktop/mobile browser checks, formatting and strict OpenSpec validation. Review clinical wording and spec conformance inline, archive, rebase onto origin/main, publish one PR to main and request AO review.

## Boundaries

Only presentation language and documentation change. No shared entity schema or workflow edge changes. Unknown values remain unknown, decision controls remain disabled and unreviewed plans remain unavailable. Existing routes remain stable; do not invent history or patient-list functionality merely to populate navigation. Future navigation vocabulary is Home, My plan, History for patients and Reviews, Patients, History for physicians.

## Test mapping

- English workflow vocabulary and fixture text: unit regression.
- Explicit en-US date/number formatting: formatting unit regression.
- English routes, banner, role switch, 404, focus, form feedback and unavailable decisions: existing Playwright routes and journeys with updated assertions.
- Complete translation/guidance consistency: residual-language search, skill sync check and manual diff review.
