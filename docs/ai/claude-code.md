# Claude Code setup for Health360

This page covers what the repository configures for Claude Code, why, how to enable it, and how a Claude session should implement work. The canonical, harness-neutral rules are in [AGENTS.md](../../AGENTS.md). The tool index is in [TOOLING.md](TOOLING.md). The workflow adoption decision (OpenSpec as the only backlog, plus selected ECC and superpowers practices) and the specialist map are in [WORKFLOW.md](WORKFLOW.md). The Codex counterpart is [codex.md](codex.md), added by the Codex tooling PR.

Verified on 2026-10-22 with Claude Code 2.1.300 on Windows 10 against code.claude.com/docs (memory, skills, sub-agents, settings, permissions, MCP).

## What is configured

| Path                          | Purpose                                                                                                                                                                                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                   | `@AGENTS.md` import (a file import, not a symlink) plus Claude-only notes. Claude Code ≥ 2.1.277 also reads `AGENTS.md` natively when there's no `CLAUDE.md`; the import keeps other sessions working and adds the notes.                                                        |
| `.claude/skills/*/SKILL.md`   | **Canonical skill source for all harnesses.** Codex mirrors these (see codex.md). Frontmatter is restricted to portable keys (`name` equal to the directory name, `description`, and for the OpenSpec-generated skills `license`, `compatibility`, `metadata`, `allowed-tools`). |
| `.claude/agents/*.md`         | Three project reviewers. `disallowedTools: Write, Edit, NotebookEdit` blocks edits. Bash is granted for read-only git and search, and staying read-only depends on their instructions, so this isn't a sandbox.                                                                  |
| `.claude/settings.json`       | Shared permissions allowlist and denylist, project MCP approvals, and the ECC marketplace declaration. **No hooks.**                                                                                                                                                             |
| `.mcp.json`                   | Project MCP servers: shadcn, next-devtools, context7, playwright.                                                                                                                                                                                                                |
| `.claude/settings.local.json` | AO-managed hooks. Ignored by `.claude/.gitignore`. **Never edit, delete, or commit it.**                                                                                                                                                                                         |

### Skills

| Skill                                                                                                                                       | Invoke                               | Use                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `implement-task`                                                                                                                            | `/implement-task p0-03-intake-draft` | The end-to-end loop: scope → plan → TDD → verify → self-review → status → PR.                                          |
| `verify`                                                                                                                                    | `/verify`                            | Definition-of-done commands and a truthful report format.                                                              |
| `new-feature`                                                                                                                               | auto                                 | Code placement, server and client boundaries, contracts, tests, and docs to update.                                    |
| `design-system`                                                                                                                             | auto on UI work                      | Tokens only, component reuse, pt-BR copy, accessibility checks.                                                        |
| `clinical-safety`                                                                                                                           | auto on clinical work                | Synthetic data, unknown ≠ negative, provenance, the review gate, fail-closed AI.                                       |
| `ai-layer`                                                                                                                                  | auto on LLM work                     | Provider interface, minimized input, Zod output, validators, blocked states.                                           |
| `workflow-transitions`                                                                                                                      | auto on state changes                | Graph invariants and exhaustive transition tests.                                                                      |
| `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `openspec-explore`, `openspec-sync-specs`, `openspec-update-change` | auto, or by name                     | OpenSpec 1.14.3 "core" workflow, generated by `openspec init --tools claude`. Don't hand-edit; regenerate (see below). |

Descriptions are front-loaded with trigger words, because Claude only sees the description until it loads a skill.

### Reviewers (project subagents)

| Agent                         | When                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `spec-conformance-reviewer`   | Before a PR. Maps each acceptance criterion or OpenSpec scenario to code plus a failing-without-it test, and flags scope creep and stale status. |
| `clinical-safety-reviewer`    | After changes to clinical data, AI, review, plan, timeline, or fixtures. An engineering review, not medical validation.                          |
| `design-consistency-reviewer` | After any UI or copy change. Source inspection only.                                                                                             |

General-purpose reviewers are **reused from the ECC plugin, not duplicated**: `ecc:typescript-reviewer`, `ecc:react-reviewer`, `ecc:security-reviewer`, `ecc:healthcare-reviewer`, `ecc:tdd-guide`, `ecc:e2e-runner`, `ecc:code-reviewer`. They're available when ECC is installed (see below).

### Permissions (`.claude/settings.json`)

- **allow**:
  - every `package.json` script (`pnpm lint|typecheck|test|test:e2e|build|verify|format|format:check|dev|start`, with arguments);
  - `pnpm install --frozen-lockfile`;
  - targeted `pnpm exec` (playwright test and install chromium, vitest, `tsc --noEmit`, eslint, `prettier --check`);
  - `node scripts/contrast.mjs`;
  - read-only `openspec` subcommands (list, show, validate, status, instructions, view);
  - `git add`, `git commit`, `git fetch`;
  - read-only `gh pr|run` queries.

  Each rule appears for both the Bash and PowerShell tools and for both `pnpm` and `pnpm.cmd`. Read-only shell commands (`ls`, `cat`, `grep`, read-only `git`, ...) are already allowed by Claude Code itself.

- **deny**: reading `.env`, `.env.local`, and `.env.*.local` (secrets; `.env.example` stays readable), and editing `.claude/settings.local.json`.
- Deliberately **not** included: `git push`, merges, and package installs. These use the normal permission flow. An `ask` rule for `git push` would stall AO workers, which are authorized to publish.
- Allow rules and `enabledMcpjsonServers` take effect only after you accept the workspace-trust dialog. Deny rules apply immediately. Allowlists are a convenience, not a security boundary.

### Why no hooks

Shared project hooks run in **every** session, including AO orchestrator and worker sessions that already carry AO hooks (`settings.local.json`) and, on this machine, ECC hooks. Everything a hook could enforce here is either covered by deny rules (secret reads, local settings) or by `pnpm verify` and the reviewers. Add a hook only if it is fast, written in Node (cross-platform), non-blocking, and justified in this document.

## MCP servers (`.mcp.json`)

| Server          | Command                                    | Use                                                                               | Notes                                                                                                    |
| --------------- | ------------------------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `next-devtools` | `npx -y next-devtools-mcp@0.4.0`           | Version-matched Next.js docs; runtime errors, routes, and logs of the running app | Runtime tools need Next ≥ 16 and a running `pnpm dev`.                                                   |
| `shadcn`        | `npx -y shadcn@4.22.1 mcp`                 | Browse and install registry components according to `components.json`             | Review generated components against the `design-system` skill.                                           |
| `context7`      | `npx -y @upstash/context7-mcp@4.4.4`       | Current library docs (Next 16, React 19, Tailwind 4, Zod 4, Playwright)           | Works anonymously. Optional `CONTEXT7_API_KEY` in your environment raises rate limits; never commit it.  |
| `playwright`    | `npx -y @playwright/mcp@0.0.83 --headless` | Ad hoc browser inspection outside AO                                              | In AO sessions, use `ao preview` / `ao browser` for the user-visible panel. `pnpm test:e2e` is separate. |

- Every entry sets `"type": "stdio"` explicitly. Versions are pinned. To update, check `npm view <pkg> version`, bump all of them together, and mirror the change in the Codex config.
- Plain `npx` launches correctly on native Windows with Claude Code 2.1.300, so no `cmd /c` wrapper is needed. Verified with headless `claude -p` runs: shadcn exposed 7 tools, next-devtools 4, and a call to the project `mcp__context7__resolve-library-id` returned `/vercel/next.js`. Playwright MCP 0.0.83 completed an MCP `initialize` handshake. On a cold `npx` cache, a server can still be connecting during the first seconds of a session.
- The servers are pre-approved through `enabledMcpjsonServers` after workspace trust. Non-interactive `claude -p` runs load project servers without prompting. To revoke approvals, run `claude mcp reset-project-choices`.
- **Duplicates:** if you also have the `context7` or `playwright` plugins enabled at user scope, Claude Code may connect both copies. The plugin copy is dropped automatically only when its command or URL is identical. Disable the plugin, or add the server name to `disabledMcpjsonServers` in your own `settings.local.json`, to keep one copy.
- **Prisma MCP (later):** evaluate it when `p0-01-persistence` is authorized. Verify the then-current command in Prisma's official docs, and point it only at the local synthetic database. Don't add it before a database exists, and never commit a connection string.

## Install and enable

Prerequisites: Node 24, pnpm 10.34.5, Claude Code ≥ 2.1.277.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium     # e2e browsers
pnpm exec openspec list                  # OpenSpec 1.14.3 is a locked devDependency; no global install
claude                                    # accept workspace trust, then /mcp to confirm the 4 servers
```

Recommended plugins (user scope; the plugin state is intentionally not forced through shared settings, see TOOLING.md):

```sh
# Official marketplace (claude-plugins-official ships with Claude Code; add it explicitly if missing)
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin install superpowers@claude-plugins-official --scope user      # brainstorming, plans, TDD, verification discipline
claude plugin install frontend-design@claude-plugins-official --scope user  # visual-quality guidance for UI work

# ECC (everything-claude-code): reviewers, TDD and verification skills, orchestration recipes
claude plugin marketplace add https://github.com/affaan-m/ECC.git           # also declared in .claude/settings.json
claude plugin install ecc@ecc --scope user
```

Then run `claude plugin list` and `/reload-plugins` (or restart). ECC ships its own hooks (configurable `hook_profile`: minimal, standard, or strict, via `claude plugin configure ecc@ecc`). Choose `minimal` if they add friction in AO sessions. The Context7 and Playwright plugins aren't needed, because `.mcp.json` provides those servers.

Regenerate the OpenSpec Claude skills after upgrading OpenSpec. This rewrites only `.claude/skills/openspec-*` and leaves `openspec/` untouched:

```sh
pnpm exec openspec init --tools claude --no-animation .
pnpm format   # generated files are committed Prettier-formatted
```

Codex mirrors `.claude/skills/`, so re-run its sync and drift check after regenerating (see codex.md).

## Recommended workflow (spec → plan → TDD → verify → review → PR)

The `implement-task` skill encodes this loop for one OpenSpec change. [WORKFLOW.md](WORKFLOW.md) is the canonical specialist map. The table below is its Claude Code view.

OpenSpec safeguards (also in `openspec/README.md`):

- `status --json` `isComplete` means the planning artifacts exist, not that anything is implemented. Check progress with `instructions apply --change <id> --json` and the unchecked boxes in `tasks.md`.
- Dependencies and medical-owner inputs aren't enforced by the CLI. Check them yourself, and never fabricate them.
- Plan inside the change's `design.md` and `tasks.md`. If a superpowers or ECC planner defaults to its own plan file, point it at those artifacts instead.
- Archive only after the change is implemented, reviewed, and merged. Never use force or skip-validation flags, and never bulk-archive.

| Step      | Project                                                                                           | OpenSpec                                                                                                    | superpowers                                                    | ECC                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1. Spec   | OpenSpec change (`openspec/README.md` is the only backlog); product context                       | `openspec-explore` → `openspec-propose` for new changes only; refine the existing change's design and tasks | `superpowers:brainstorming` for unclear scope                  | `ecc:plan-prd` / `ecc:product-capability` (optional)                                                |
| 2. Plan   | `implement-task` §1 plus the domain recipes                                                       | `tasks.md` is the plan                                                                                      | `superpowers:writing-plans`                                    | `ecc:plan`, agent `ecc:planner` / `ecc:architect`                                                   |
| 3. TDD    | `new-feature` §5; `clinical-safety` gate tests                                                    | `openspec-apply-change` works through `tasks.md`                                                            | `superpowers:test-driven-development`                          | `ecc:tdd-workflow`, agent `ecc:tdd-guide`; `ecc:e2e-runner` for Playwright                          |
| 4. Verify | `/verify` (`pnpm verify`, `pnpm test:e2e`, `pnpm format:check`)                                   | `openspec validate --all --strict --no-interactive`                                                         | `superpowers:verification-before-completion`                   | `ecc:verification-loop`                                                                             |
| 5. Review | `spec-conformance-reviewer`, `clinical-safety-reviewer`, `design-consistency-reviewer`            | —                                                                                                           | `superpowers:requesting-code-review` / `receiving-code-review` | `ecc:typescript-reviewer`, `ecc:react-reviewer`, `ecc:security-reviewer`, `ecc:healthcare-reviewer` |
| 6. PR     | `implement-task` §6 (conventional commits, PR body with criteria → tests and verification output) | `openspec-archive-change` after merge                                                                       | `superpowers:finishing-a-development-branch`                   | `ecc:pr`                                                                                            |

Rules that hold at every step:

- **One task per session.** Never implement MVP features that weren't asked for.
- **Check APIs before using them.** Verify unstable APIs with Context7, next-devtools docs, or `node_modules/next/dist/docs/` before writing code.
- **Evidence before claims.** Paste real command output.
- **Escalate medical decisions.** Medical criteria, evidence, and expected outcomes come from a human medical owner. Escalate, don't invent.

### In AO sessions

AO workers have their own lifecycle: `ao report` checkpoints, AO native review via `ao review trigger`, and orchestrator-managed merges. AO workers are typically told **not** to spawn subagents. In that case, apply the reviewer agents' checklists yourself; the agent files and the `clinical-safety` and `design-system` skills hold the checklists. Use AO's native reviewer for the PR. Use `ao preview` / `ao browser` for UI checks. Project subagents and superpowers or ECC delegation patterns are for non-AO sessions or when the session allows delegation.

## Verifying this setup

```sh
claude mcp list                     # 4 project servers; "Pending approval" until trusted interactively
claude -p "List the project skills and project agents you can see, and the MCP servers connected."
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8'))"
```

Inside a session, `/skills`, `/agents`, `/mcp`, `/status` ("Setting sources"), and `claude doctor` report what loaded and which entries were rejected.
