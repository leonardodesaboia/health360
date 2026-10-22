---
name: workflow-transitions
description: Modify Health360 workflow states and transition contracts without bypassing analysis, clarification or physician review.
---

Read USER_FLOWS.md and src/features/workflow/workflow.ts and its tests.
Document why an edge is needed, which actor/service owns it and which server preconditions apply. The pure graph checks adjacency only; it is not authorization.
Keep the full status union and pt-BR labels exhaustive. Clarification returns through analysis; plan publication follows completed medical review; profile updates preserve prior plans and enter reassessment.
Update graph, schemas, status UI and docs together. Cover every legal/illegal pair and affected failure/retry journeys independently of the implementation map.
Do not add a direct AI-to-plan edge or let a UI click claim analysis/review completion. Future server handlers must verify ownership, evidence, versions and review completeness atomically.
Run pnpm verify and the affected e2e flows. Report compatibility/migration needs if persisted states already exist.
