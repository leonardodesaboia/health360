# Health360 agent guide

Read this first. This is the canonical guide for Claude Code and Codex.

## Scope and source of truth

This repository currently contains the **foundation**, not the functioning MVP.
Read [ARCHITECTURE.md](ARCHITECTURE.md) for implemented boundaries,
[product context](docs/product/PRODUCT_CONTEXT.md) for future requirements, and
[backlog](docs/backlog/IMPLEMENTATION.md) for ordered implementation tasks.
Product-context imperatives describe future work; they do not authorize implementing everything.
Do only the assigned task. Never add database access, LLM calls, persistence or clinical logic incidentally.

## Pick up a task

1. Select the earliest uncompleted backlog task whose dependencies are complete. Confirm the user's assigned scope and publishing restrictions.
2. Inspect the affected code and tests; read the relevant skill below. Verify changing APIs against installed types, Context7 or official docs.
3. State a short implementation plan, including server boundaries and failure behavior. Add dependencies only when needed and verify package names and peers.
4. Implement a thin vertical slice in `src/features/<feature>`. Keep routes as composition. Default to Server Components; add `use client` only for interaction.
5. Add meaningful tests for the acceptance criteria and negative paths. Never weaken clinical gates to make a test pass.
6. Update the relevant canonical doc and mark backlog status with evidence. Run the definition of done and summarize limitations honestly.

## Commands

Use Node 24 and pnpm 10.34.5. On restricted Windows PowerShell use `pnpm.cmd`.

- `pnpm install --frozen-lockfile`
- `pnpm dev` — loopback development server, normally port 3000
- `pnpm verify` — ESLint, strict typecheck, Vitest, production build
- `pnpm exec playwright install chromium` — one-time browser installation
- `pnpm test:e2e` — desktop/mobile Chromium against production build on port 3100
- `pnpm format` / `pnpm format:check`

## Design and code conventions

- UI text is natural pt-BR; identifiers and technical docs are English.
- Use [design tokens](DESIGN_GUIDELINES.md); no raw colors or arbitrary Tailwind palette classes in features. Reuse the shared components before creating new ones.
- Geist typography; 4 px spacing rhythm; patient mobile-first, physician desktop-first. Avoid decorative charts, invented scores, gradients and redundant cards.
- Strict TypeScript. Runtime-validate external data with Zod. Model unknown values explicitly; never default unknown clinical facts to false.
- Pure domain rules live outside JSX. Server-only secrets and future integrations stay out of client imports. Do not log personal data or raw model responses.
- No empty folders, placeholder services, generic mega-components or speculative infrastructure.
- Keep `.claude/settings.local.json` untouched and untracked. Never commit secrets or real patient data. No global tool/config edits without user scope.

## Clinical boundaries

Synthetic data only. Never imply clinical validation, efficacy or accuracy.
Distinct provenance: patient-reported, system-structured, rule-generated, AI explanation, physician-reviewed.
No invented evidence, autonomous diagnosis or unsupported recommendation. Version evidence, profiles, analyses and decisions.
Software schema validation is not medical approval. A role switch is navigation, not authorization.
The workflow graph is administrative adjacency only; future server services must enforce identity, ownership, evidence integrity, version freshness, completeness and physician review before publication.
AI timeout, malformed output, missing/unknown evidence or unsupported category must block publication. Do not bypass a blocked result with a fallback recommendation.
Do not store private chain-of-thought; retain only relevant input versions, structured outputs and audit metadata.

## Recipes and review

Skills are plain Markdown and can be read by either agent:

- [Design consistency](.claude/skills/design-system/SKILL.md)
- [Clinical safety](.claude/skills/clinical-safety/SKILL.md)
- [New feature](.claude/skills/new-feature/SKILL.md)
- [AI layer](.claude/skills/ai-layer/SKILL.md)
- [Workflow transitions](.claude/skills/workflow-transitions/SKILL.md)
- [Implement a backlog/OpenSpec task](.claude/skills/implement-task/SKILL.md)
- [Verification](.claude/skills/verify/SKILL.md)
- [Spec conformance reviewer](.claude/agents/spec-conformance-reviewer.md)

Optional Claude reviewers live in `.claude/agents/`. These are engineering reviewers, not medical reviewers.
Tool activation and sources: [AI tooling](docs/ai/TOOLING.md).

## Definition of done

Acceptance and failure paths are covered, no scope creep, no sensitive data. `pnpm verify`, `pnpm test:e2e` and `pnpm format:check` pass.
For UI changes inspect mobile/desktop, keyboard focus, empty/error/disabled states and pt-BR copy.
Review clinical publication gates and provenance when touched. Update docs and report exact validation plus unverified aspects.
Commits use conventional messages. Publish only within the current user's authorization; this foundation task is local-only.
