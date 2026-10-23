## Context

The current plan route uses static foundation fixtures. The shared contracts model immutable plans and finalized reviews. The Wave 2 brief authorizes synthetic producer fixtures until review/session producers land.

## Goals / Non-Goals

Publish only physician-decided content with current profile, analysis and context versions; protect direct URLs and repeated/concurrent requests. No medical validation claim, action tracking mutation, new evidence, or producer record writes.

## Decisions

- Pure plan derivation in `features/preventive-plan` consumes shared typed records; validates ownership, exact proposal coverage, finalized decisions, required reasons, evidence integrity and current cycle links before deriving content.
- Approved proposal titles or modified reviewed text become actions, reviewed redundancy text, or pending information according to category. Reject decisions never become advice. Pending decisions block publication. CLARIFY decisions block publication until the clarification cycle is resolved; pending-information content can only derive from explicitly approved clarification text.
- Server publication runs inside a dataset transaction with serialization against competing publication/cycle writes. It appends only plan and publication event, uses the shared legal workflow transition, and returns an existing plan for the same review on retry.
- The route loads only session-owned persisted plans and never renders raw proposals. Missing session, blocked analysis, pending review and stale cycle states use explicit English notices. A failed load uses the route error boundary.
- Reuse existing layout, notice and surface components. Patient language stays tied to reviewed text; generic next steps add no clinical advice.

## Risks / Trade-offs

Upstream demo-session and workflow storage are in flight; coordinate their import and transaction APIs rather than duplicating them. Demo navigation remains separate from real identity authorization.

## Verification Plan

Unit tests prove exact derivation and rejection gates, ownership and stale versions; service tests prove atomic writes and idempotence. Production Playwright checks unavailable/direct URL and published plan content at desktop/mobile sizes. Run full definition-of-done checks and inline clinical/design/spec review before archive and PR.
