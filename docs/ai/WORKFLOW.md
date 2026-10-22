# Spec-driven implementation workflow

Decision: adopt **OpenSpec as the single backlog**, supported by selected ECC and
superpowers practices. Research verified against the primary sources linked below
on 2026-10-22. Existing code remains the foundation; these workflow artifacts do not
implement the MVP.

## What is adopted

| Tool                         | Decision for Health360                                       | Reason                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OpenSpec                     | Canonical changes/specs/design/tasks                         | Reviewable changes fit the existing Node toolchain and work across coding agents.                                                                                        |
| ECC / everything-claude-code | Selective stack, clinical-boundary and review recipes        | Complements the spec workflow; does not own another backlog or prescribe clinical criteria.                                                                              |
| superpowers                  | Brainstorming, planning, TDD and evidence-based verification | Useful execution discipline around the same OpenSpec artifacts.                                                                                                          |
| GitHub Spec Kit              | Compared, not initialized                                    | Supports structured specs/plans/tasks and agent integrations, but introducing another process tree would duplicate our source of truth and adds Python/uv prerequisites. |

This choice is a project judgment, not a claim that one framework is universally
better. Keep instructions small and task-specific. No application runtime dependency
is required for any of these planning tools.

## Canonical artifacts and status

[openspec/README.md](../../openspec/README.md) indexes P0/P1 in dependency order.
Each change contains `proposal.md`, delta `specs/`, `design.md`, `tasks.md` and
`.openspec.yaml`. All future implementation checkboxes start unchecked.
`openspec/specs/foundation/spec.md` describes only current implemented behavior.
Flows A–E belong to the prepared-demonstration change. The old backlog document is
a redirect, without copied acceptance criteria or task status.

Use the change's design/tasks for refinement and execution evidence. If a planning
plugin defaults to a separate plan directory, direct it to these existing artifacts.
Do not maintain both a plugin task list and a separate authoritative backlog.
Planning artifacts can be complete while implementation remains entirely pending.
Archive after implementation and review, so future requirements become baseline
specs only when delivered.

In pinned OpenSpec 1.14.3, `status --json` reports `isComplete` for **planning
artifacts**. Use `instructions apply --change <id> --json` to inspect implementation
checkbox progress. The repository's planned changes are not completed features,
and dependency/medical-owner preconditions are not enforced by that status flag.

OpenSpec core was originally initialized for real with
`npx -y @fission-ai/openspec@1.14.3 init --tools none`. The exact package is now a
locked development dependency (`@fission-ai/openspec`: `1.14.3`), verified with npm
metadata. After `pnpm install --frozen-lockfile`, every agent uses the project CLI:

```sh
pnpm exec openspec list
pnpm exec openspec status --change p0-01-persistence
pnpm exec openspec instructions apply --change p0-01-persistence
pnpm exec openspec validate --all --strict --no-interactive
```

For a fresh setup that needs initialization, `pnpm exec openspec init --tools none`
creates only core files. Existing clones already contain them; do not rerun init
or generate integrations belonging to another worker. Core-only initialization
avoids overwriting project-specific agent integrations.
Use the companion tooling instructions in [TOOLING.md](TOOLING.md) for the installed
Claude/Codex integration. OpenSpec's default agent operations are explore, propose,
apply and archive; upstream spells them `/opsx:propose` in Claude and
`$openspec-propose` in Codex. Use only commands actually installed in your client;
the pinned CLI and Markdown remain the fallback when slash skills are absent.
Expanded upstream operations require their profile; do not assume `/opsx:verify`
is installed by the default profile. Project verification commands work independently.

## Step-by-step specialist map

These are **development** agents/recipes, not application multiagent architecture.
Use only the active environment's permitted delegation/review path; otherwise read
the relevant guidance inline and report that no independent reviewer was run.

| Stage                    | Artifact / result                                                               | Relevant specialist or recipe                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spec                     | Current behavior distinguished from proposed requirements and failure scenarios | ECC `spec-miner` only for mining implemented behavior; superpowers `brainstorming` for unresolved needs                                                    |
| Plan                     | Concrete boundaries, dependencies and test plan in change design/tasks          | ECC `/ecc:plan` (manual installs may expose `/plan`); superpowers `writing-plans`                                                                          |
| TDD                      | Meaningful red → green → refactor evidence for the assigned slice               | ECC `tdd-guide`, `tdd-workflow`; superpowers `test-driven-development`                                                                                     |
| Framework implementation | Server/client boundaries and version-correct framework APIs                     | ECC `nextjs-turbopack`; `prisma-patterns` only when persistence is authorized                                                                              |
| Clinical boundary        | Provenance, unknowns, review gate and restricted rule separation                | ECC `healthcare-reviewer`, `healthcare-cdss-patterns`, `healthcare-phi-compliance`; project clinical-safety recipe                                         |
| Verify                   | Actual command output and critical user-flow evidence                           | ECC `verification-loop`, `e2e-runner`; superpowers `verification-before-completion`                                                                        |
| Review                   | Spec conformance and actionable findings before publication                     | Project spec-conformance reviewer; ECC `code-reviewer`, `typescript-reviewer`, `react-reviewer` for TSX, `security-reviewer` for trust/secret/auth changes |

ECC's `spec-miner` explicitly writes OpenSpec baseline specs, making it useful when
extracting existing behavior. Review its output for observable assertions and test
anchors; never mine future product prose as implemented functionality.

`healthcare-cdss-patterns` includes broader drug/dose/scoring examples and
`healthcare-phi-compliance` discusses several jurisdictions. Those examples do not
authorize adding scores, dosing, PHI storage, RLS infrastructure or a compliance
claim here. Use applicable engineering principles only. Qualified medical owners
must supply scenario criteria and approve clinical content; AI review is not clinical
validation or a Brazil-specific legal assessment.

ECC `/orch-add-feature` is a gated research/plan/TDD/review wrapper, exposed as
`/ecc:orch-add-feature` by plugin namespacing. It is optional: it can otherwise create
duplicate plans, extra delegation and approval gates. Use it only when the current
task/workflow permits those behaviors, keeping OpenSpec authoritative. An existing
authorization remains controlling; do not introduce repetitive approval prompts.

Before PR: finish assigned scenarios, pass `pnpm verify`, `pnpm test:e2e`,
`pnpm format:check` and strict OpenSpec validation; review spec conformance and the
relevant specialist lanes. Keep actual results in the task/PR, distinguish synthetic
software checks from medical validation, address findings, and obey publishing scope.
The orchestrator owns AO review and merging of the foundation PR.

## Installation and enablement

The machine inventory already records `ecc@ecc` 2.2.2 and superpowers 6.3.0 as
Claude plugins. Upstream ECC currently identifies itself as 2.2.3; inventory is not
proof that every current upstream feature is installed or enabled. Check `/plugin`
and the installed skill/agent list. No machine plugin was reinstalled by this task.

For a new Claude environment, these are verified marketplace commands (run inside
Claude Code, deliberately selecting plugin/hook trust):

```text
/plugin marketplace add https://github.com/affaan-m/ECC
/plugin install ecc@ecc
/plugin marketplace add anthropics/claude-plugins-official
/plugin install superpowers@claude-plugins-official
```

The legacy `affaan-m/everything-claude-code` repository URL redirects to
`affaan-m/ECC`; current marketplace/plugin identifiers are `ecc@ecc`.
Native ECC installation includes plugin-managed hooks: inspect those before enabling
on another machine and do not layer a full manual installation over the plugin.
This repository does not copy ECC hooks or change AO's local settings.

For Codex, follow the companion `docs/ai/codex.md` integration when merged and the repository's canonical Markdown links;
Claude-installed agents are not automatically Codex agents. Official OpenAI docs
describe repository skill discovery in `.agents/skills` and guidance in AGENTS.md.
Use the companion integration's supported discovery path rather than duplicate all
clinical recipes into a second instruction tree. Installing optional user plugins
is a separate deliberate action; portable Markdown/CLI use needs no global changes.

## Primary sources

- [OpenSpec README and workflow](https://github.com/Fission-AI/OpenSpec), [CLI](https://openspec.dev/docs/cli), [supported tools](https://openspec.dev/docs/supported-tools)
- [ECC current repository and installation](https://github.com/affaan-m/ECC), [marketplace manifest](https://github.com/affaan-m/ECC/blob/main/.claude-plugin/marketplace.json), [feature wrapper](https://github.com/affaan-m/ECC/blob/main/commands/orch-add-feature.md)
- [ECC spec-miner](https://github.com/affaan-m/ECC/blob/main/agents/spec-miner.md), [healthcare reviewer](https://github.com/affaan-m/ECC/blob/main/agents/healthcare-reviewer.md), [TypeScript reviewer](https://github.com/affaan-m/ECC/blob/main/agents/typescript-reviewer.md), [React reviewer](https://github.com/affaan-m/ECC/blob/main/agents/react-reviewer.md)
- [Clinical engineering patterns](https://github.com/affaan-m/ECC/blob/main/skills/healthcare-cdss-patterns/SKILL.md), [PHI patterns](https://github.com/affaan-m/ECC/blob/main/skills/healthcare-phi-compliance/SKILL.md), [Next/Turbopack](https://github.com/affaan-m/ECC/blob/main/skills/nextjs-turbopack/SKILL.md), [Prisma](https://github.com/affaan-m/ECC/blob/main/skills/prisma-patterns/SKILL.md), [TDD](https://github.com/affaan-m/ECC/blob/main/skills/tdd-workflow/SKILL.md), [verification](https://github.com/affaan-m/ECC/blob/main/skills/verification-loop/SKILL.md)
- [superpowers methodology and installs](https://github.com/obra/superpowers)
- [GitHub Spec Kit prerequisites and SDD workflow](https://github.com/github/spec-kit)
- [Official OpenAI skill discovery](https://learn.chatgpt.com/docs/build-skills), [AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
