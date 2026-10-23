## Why

HISIC 2026 is international and the demonstration is due November 3, 2026. The user has selected English for all product content and guidance, superseding the previous Portuguese requirement.

## What Changes

- Translate existing UI, fixtures, tests, documentation, OpenSpec context and agent guidance into US English.
- Declare English document language and use explicit en-US display formatting.
- Record the language decision in ADR0004 and synchronize portable skills.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `foundation`: English reference screens and document language.
- `demo-mode`: English demonstration labels and role links.
- `workflow-state`: English administrative labels with unchanged transitions.

## Impact

This is the authorized EN wave task, `en-language-switch`, not a backlog entry. Existing foundation contracts satisfy dependencies; no unmerged implementation is needed. Public entity schemas, identifiers, routes and safety gates remain compatible. No persistence, clinical criteria, model calls or new functional modules are in scope.

Tests cover English labels, en-US formatting, navigation, unknowns and existing disabled publication behavior. Canonical product/design/component/workflow docs, guidance and specs change together.
