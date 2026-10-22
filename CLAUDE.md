@AGENTS.md

## Claude Code notes

AGENTS.md (imported above) is canonical. This file only adds Claude Code specifics. Setup, plugins, and the full workflow are in [docs/ai/claude-code.md](docs/ai/claude-code.md).

- **Skills** (`.claude/skills/`, shared with Codex): use `/implement-task` for a backlog task or OpenSpec change, and `/verify` before claiming done. Recipes load automatically when relevant: `design-system`, `clinical-safety`, `new-feature`, `ai-layer`, `workflow-transitions`. OpenSpec: `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `openspec-explore`.
- **Reviewers** (`.claude/agents/`, read-only): `spec-conformance-reviewer`, `clinical-safety-reviewer`, `design-consistency-reviewer`. For general code, reuse the ECC plugin agents when they're installed (`ecc:typescript-reviewer`, `ecc:react-reviewer`, `ecc:security-reviewer`, `ecc:healthcare-reviewer`, `ecc:tdd-guide`, `ecc:e2e-runner`).
- **AO sessions:** follow the session's delegation rules. If subagents are disallowed, apply the reviewer checklists yourself and use AO's native review for the PR.
- **MCP** (`.mcp.json`): `next-devtools` (start `pnpm dev` for runtime tools), `shadcn`, `context7` (current library docs; use it before writing against Next 16, React 19, Tailwind 4, or Zod 4 APIs), and `playwright`. For the AO Browser panel, use `ao browser`, not Playwright MCP.
- **Settings:** `.claude/settings.json` is shared and has no hooks. Never edit, delete, or commit `.claude/settings.local.json` (it holds AO hooks).
- **Windows:** both the Bash and PowerShell tools are available. In PowerShell, use `pnpm.cmd` if the execution policy blocks `pnpm`.
