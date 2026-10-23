# Health360 agent guide

Read this first. This is the canonical guide for Claude Code and Codex.

## Scope and source of truth

This repository currently contains the **foundation**, not the functioning MVP.
Read [ARCHITECTURE.md](ARCHITECTURE.md) for implemented boundaries,
[product context](docs/product/PRODUCT_CONTEXT.md) for future requirements, and
[canonical ordered index](docs/backlog/IMPLEMENTATION.md) for ordered implementation tasks.
Product-context imperatives describe future work; they do not authorize implementing everything.
Do only the assigned task. Never add database access, LLM calls, persistence or clinical logic incidentally.

## Pick up a task

1. **Backlog → spec:** choose the first authorized entry in docs/backlog/IMPLEMENTATION.md whose dependencies are satisfied. Use its stable change ID to create or resume `openspec/changes/<id>/` with `pnpm exec openspec new change <id>`. Link the proposal to the entry; refine specs/design/tasks without copying long acceptance lists. Mark the index in progress with the actual change link. Baseline specs describe implemented behavior only. ECC spec-miner extracts existing behavior, never future MVP claims.
2. **Plan:** inspect affected code/tests and use relevant recipes. Use superpowers brainstorming for unresolved requirements, writing-plans or ECC `/plan` for implementation detail. Keep the result in the change's `design.md`/`tasks.md`; no parallel backlog or plan directory. Verify changing APIs against current primary docs.
3. **TDD:** use ECC `tdd-guide` / `tdd-workflow` or superpowers `test-driven-development`: reproduce a meaningful failure, implement the smallest fix, then refactor. Keep domain logic outside JSX and services server-only. Do not implement unrelated changes.
4. **Verify:** use ECC `verification-loop` / `e2e-runner` and superpowers `verification-before-completion`. Run focused regressions, `pnpm verify`, `pnpm test:e2e`, format and strict OpenSpec validation. Record real output against completed task checkboxes; do not claim unimplemented scenarios pass.
5. **Review:** check spec conformance, ECC `code-reviewer` and `typescript-reviewer`, plus `react-reviewer` for TSX; apply `healthcare-reviewer` to clinical data/publication boundaries and `security-reviewer` to trust/secret/auth changes. Review skill guidance inline when delegation is unavailable; never pretend a separate reviewer ran. Formal medical review remains mandatory before real clinical use; demo authoring follows the policy below.
6. After implementation, verification and review, archive with `pnpm exec openspec archive <id>` without skipping checks. Mark the ordered index entry done with archive, verification and PR links. Never archive an unimplemented plan or treat CLI planning completeness as delivered functionality. See [workflow mapping and tool fallbacks](docs/ai/WORKFLOW.md).

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

- UI text, identifiers and documentation use natural US English. Dates and numbers use en-US formatting.
- Use [design tokens](DESIGN_GUIDELINES.md); no raw colors or arbitrary Tailwind palette classes in features. Reuse the shared components before creating new ones.
- Geist typography; 4 px spacing rhythm; patient mobile-first, physician desktop-first. Avoid decorative charts, invented scores, gradients and redundant cards.
- Strict TypeScript. Runtime-validate external data with Zod. Model unknown values explicitly; never default unknown clinical facts to false.
- Pure domain rules live outside JSX. Server-only secrets and future integrations stay out of client imports. Do not log personal data or raw model responses.
- No empty folders, placeholder services, generic mega-components or speculative infrastructure.
- Keep `.claude/settings.local.json` untouched and untracked. Never commit secrets or real patient data. No global tool/config edits without user scope.

## Clinical boundaries

Synthetic data only. Never imply clinical validation, efficacy or accuracy.
Distinct provenance: patient-reported, system-structured, rule-generated, AI explanation, physician-reviewed.
Agents may author synthetic scenarios, demonstrative rules and expected demo outcomes.
Each must carry `validation: "demonstrative"` (or equivalent `reviewStatus`) in data and
show **DEMONSTRATIVE — NOT CLINICALLY VALIDATED** wherever displayed in the UI.
Evidence references require real, publicly verifiable guideline name, issuer, year and URL.
Never fabricate citations, statistics or accuracy claims. Without a supporting source,
mark `evidence: placeholder` and display that limitation; placeholders never satisfy
evidence validation or bypass publication gates. In-app physician review remains
mandatory; a demo reviewer is never real clinical validation. Real clinical use
requires formal medical review. See [ADR0003](docs/adr/0003-mvp-runtime-decisions.md).
No autonomous diagnosis or unsupported recommendation. Version evidence, profiles, analyses and decisions.
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
For UI changes inspect mobile/desktop, keyboard focus, empty/error/disabled states and US English copy.
Review clinical publication gates and provenance when touched. Update docs and report exact validation plus unverified aspects.
Commits use conventional messages. Publish only within the current user's authorization. The foundation PR is authorized; do not merge it. Respect the active environment's delegation and review policies over optional plugin automation.
