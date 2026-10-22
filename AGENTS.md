# Health360 agent guide

Read this first. This is the canonical guide for Claude Code and Codex.

## Scope and source of truth

This repository currently contains the **foundation**, not the functioning MVP.
Read [ARCHITECTURE.md](ARCHITECTURE.md) for implemented boundaries,
[product context](docs/product/PRODUCT_CONTEXT.md) for future requirements, and
[canonical OpenSpec backlog](openspec/README.md) for ordered implementation tasks.
Product-context imperatives describe future work; they do not authorize implementing everything.
Do only the assigned task. Never add database access, LLM calls, persistence or clinical logic incidentally.

## Pick up a task

1. **Spec:** choose the first authorized OpenSpec change whose dependencies are complete. Read its proposal, specs, design and unchecked tasks; distinguish implemented `openspec/specs` from future `openspec/changes`. Confirm scope and publishing restrictions. ECC `spec-miner` is for extracting existing behavior only, never inventing implemented MVP behavior.
2. **Plan:** inspect affected code/tests and use relevant recipes. Use superpowers brainstorming for unresolved requirements, writing-plans or ECC `/plan` for implementation detail. Keep the result in the change's `design.md`/`tasks.md`; no parallel backlog or plan directory. Verify changing APIs against current primary docs.
3. **TDD:** use ECC `tdd-guide` / `tdd-workflow` or superpowers `test-driven-development`: reproduce a meaningful failure, implement the smallest fix, then refactor. Keep domain logic outside JSX and services server-only. Do not implement unrelated changes.
4. **Verify:** use ECC `verification-loop` / `e2e-runner` and superpowers `verification-before-completion`. Run focused regressions, `pnpm verify`, `pnpm test:e2e`, format and strict OpenSpec validation. Record real output against completed task checkboxes; do not claim unimplemented scenarios pass.
5. **Review:** check spec conformance, ECC `code-reviewer` and `typescript-reviewer`, plus `react-reviewer` for TSX; apply `healthcare-reviewer` to clinical data/publication boundaries and `security-reviewer` to trust/secret/auth changes. Review skill guidance inline when delegation is unavailable; never pretend a separate reviewer ran. Clinical review by a qualified human remains mandatory for medical criteria.
6. Update the change and canonical docs, address findings, publish only as authorized, and archive through OpenSpec only after implementation/verification/review. Keep prior specs and clinical versions traceable. See [workflow mapping and tool fallbacks](docs/ai/WORKFLOW.md).

## Commands

Use Node 24 and pnpm 10.34.5. On restricted Windows PowerShell use `pnpm.cmd`.

- `pnpm install --frozen-lockfile`
- `pnpm dev` — loopback development server, normally port 3000
- `pnpm verify` — ESLint, strict typecheck, Vitest, production build
- `pnpm exec playwright install chromium` — one-time browser installation
- `pnpm test:e2e` — desktop/mobile Chromium against production build on port 3100
- `pnpm format` / `pnpm format:check`
- `pnpm exec openspec validate --all --strict --no-interactive` — locked OpenSpec 1.14.3; use `pnpm exec openspec` for all project CLI operations, no global install

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
Harness-specific setup is owned separately: [Claude Code](docs/ai/claude-code.md)
and [Codex](docs/ai/codex.md). Those documents are delivered by their respective
tooling PRs; this root guide remains the harness-neutral policy source.

## Definition of done

Acceptance and failure paths are covered, no scope creep, no sensitive data. `pnpm verify`, `pnpm test:e2e` and `pnpm format:check` pass.
For UI changes inspect mobile/desktop, keyboard focus, empty/error/disabled states and pt-BR copy.
Review clinical publication gates and provenance when touched. Update docs and report exact validation plus unverified aspects.
Commits use conventional messages. Publish only within the current user's authorization. The foundation PR is authorized; do not merge it. Respect the active environment's delegation and review policies over optional plugin automation.
