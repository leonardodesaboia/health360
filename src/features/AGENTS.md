# Feature implementation

Apply root AGENTS.md and the canonical `.claude/skills/new-feature/SKILL.md` recipe.
Routes compose feature behavior; keep domain decisions outside JSX and client state.

- `patients/contracts.ts` is the initial entity/schema source, not a persistence
  implementation. Reuse its types and explicitly represent unknown facts.
- `workflow/workflow.ts` defines legal administrative transitions only. A legal
  edge never proves authorization, evidence integrity or completed physician review.
- Keep fixtures synthetic, labeled and immutable. New persistence, provider calls
  or clinical rules require the corresponding assigned OpenSpec change. Refine
  its existing design/tasks; do not keep a second feature plan or task list.
- For state/schema changes update colocated unit tests, including invalid inputs,
  illegal transitions and failure behavior. Review publication gates and provenance
  with the clinical-safety/workflow skills before changing patient-visible status.
- Reuse shared components and semantic tokens; read the design-system skill for UI.
