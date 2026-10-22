# AI implementation tooling

Verified on 2026-10-22 against the official sources below and npm package metadata.
No plugin installations, global configuration edits, secret setup or provider calls
were performed by this foundation. Project instructions work without optional tools.

## Delivered in the repository

`AGENTS.md` is canonical; `CLAUDE.md` imports it with `@AGENTS.md` on its own line
(not inside code ticks). This is a file import, not a Windows symlink. Next's
automatic agent-rule writing is disabled through `agentRules: false` to keep this
file source-owned. Consult installed framework docs in `node_modules/next/dist/docs`
when upgrading or using unfamiliar APIs.

Five project skills live under `.claude/skills/<name>/SKILL.md`: `design-system`,
`clinical-safety`, `new-feature`, `ai-layer` and `workflow-transitions`. Each has
`name`/`description` YAML frontmatter. Claude discovers them from the project;
invoke `/design-system`, `/new-feature`, etc. Codex and other agents can read the
same recipes via AGENTS.md links; do not assume Claude-specific discovery applies
to another client.

Two engineering reviewers live under `.claude/agents`: `clinical-safety-reviewer`
and `design-consistency-reviewer`. Their `tools: Read, Glob, Grep` allowlist prevents
edits and shell execution. Ask Claude to use the appropriate reviewer for an assigned
change, subject to the active environment's delegation policy. Neither replaces
medical review, a complete accessibility audit or authorized provider review.

`.claude/settings.json` has an exact allowlist for verification/dev scripts plus
common read-only git/rg commands, including `.cmd` variants for Windows. It grants
no publishing or arbitrary pnpm execution. No hooks were added: project hooks affect
every AO session and are unnecessary here. AO's ignored `settings.local.json` and
`.claude/.gitignore` remain untouched. Command allowlists are convenience, not a
security boundary; script contents still require review.

## Project MCP configuration

`.mcp.json` follows Claude's `mcpServers` format. Versions are pinned to the verified
releases instead of silently upgrading on each agent launch.

| Server        | Package / command arguments                | Purpose / prerequisite                                                       |
| ------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| shadcn        | `npx -y shadcn@4.22.1 mcp`                 | Find accessible registry components using `components.json`                  |
| next-devtools | `npx -y next-devtools-mcp@0.4.0`           | Routes, errors and version-matched docs; start `pnpm dev` for runtime access |
| playwright    | `npx -y @playwright/mcp@0.0.83 --headless` | Browser inspection outside AO; browser may need installing                   |
| context7      | `npx -y @upstash/context7-mcp@4.4.4`       | Current library documentation; key recommended for higher limits             |

Restart Claude and run `/mcp`; approve/trust each project server explicitly and check
its connection. Do not enable all servers globally by default. Network access and
initial package download are needed. MCP config is delivered; an authenticated
end-to-end connection in each coding client is not assumed.

These local servers start without committed secrets. Context7's authenticated service
may require a key for queries/rate limits: obtain one separately, keep it in a local
environment variable and pass `--api-key` according to its docs. Do not commit the key.
If the installed Context7 or Playwright plugin already provides the same service,
enable one source only to avoid duplicated tools. The external tools receive queries
and browser content: synthetic data and public documentation only.

On native Windows, a client that cannot launch `npx` directly can use the documented
wrapper: `command: "cmd"`, `args: ["/c", "npx", "-y", ...originalArgsWithoutY]`.
Keep the portable config in git and apply machine-specific changes only deliberately.
PowerShell terminals can run `npx.cmd` and `pnpm.cmd` to avoid script execution-policy
errors; do not weaken machine policy for the project.

`.mcp.json` is not a universal client configuration file. Other clients must register
the same pinned commands in their own supported MCP settings; use their official
docs. AGENTS.md and the plain Markdown recipes remain usable without MCP.

**AO Browser:** use `ao preview` and `ao browser` for the session-owned page.
The Playwright MCP browser is a separate runtime and cannot control that panel.
Automated `pnpm test:e2e` is also independent, intentionally running production smoke.

Prisma MCP is deferred until a database task is authorized. Do not install a DB tool
or expose a connection URL simply because it is available. Use official Prisma docs
to verify its then-current setup during P0-01.

## Machine plugin inventory and recommendations

The local installation manifest at setup records these user-scoped plugins:
frontend-design, superpowers, context7, playwright, code-review and feature-dev from
`claude-plugins-official`, plus `ecc@ecc` 2.2.2. Inventory does not prove every plugin
is enabled in every session. No machine paths or user settings are needed in git.

Recommended baseline: the project recipes plus frontend-design for UI critique,
Context7 for changing APIs and Playwright for interaction checks. Superpowers can
help focused planning/testing; ECC offers broader recipes but its hooks may add cost
and conflict with AO, so evaluate those individually rather than copying its whole
configuration. The two project reviewers provide domain-specific engineering checks.
Additional code-review/feature-dev plugins are optional, already present on this
machine, and not required for setup.

For a **new machine**, after deciding to install optional plugins, the verified
Claude CLI syntax is:

```sh
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin install frontend-design@claude-plugins-official --scope user
claude plugin install context7@claude-plugins-official --scope user
claude plugin install playwright@claude-plugins-official --scope user
claude plugin install superpowers@claude-plugins-official --scope user
```

Check `claude plugin list`, then `/reload-plugins` or restart. In an interactive
Claude session `/plugin` shows installed/enabled state and lets you choose scope.
Do not reinstall these on this machine just because commands appear here. ECC is
already installed; no new third-party marketplace installation is recommended for
the foundation. Plugin state is intentionally not forced through shared settings.

## Package compatibility and validation

Registry metadata verified Next 16.4.2, React/React DOM 19.3.1, Tailwind/PostCSS
4.3.3, shadcn CLI 4.22.1, RHF 7.90.0, Zod 4.6.7, resolvers 6.0.0, Lucide 1.61.0,
Vitest 5.0.5 and Playwright test 1.64.1. The exact application tree is locked by
`pnpm-lock.yaml`. TypeScript 6.0.3 / ESLint 9.39.5 match lint-plugin peers; the latest
7/10 majors do not. ESLint 9 is deprecated upstream: track a coordinated plugin
upgrade, not a forced peer override. Node types intentionally match Node 24.

`pnpm verify` runs lint, strict typecheck, unit tests and build. E2E is a separate
`pnpm test:e2e`, also in CI. `pnpm format:check` checks format; `node scripts/contrast.mjs`
computes documented token contrast. Neither proves clinical validity. See README
for install/run commands and architecture for test limits.

## Verified primary sources

- [Next installation](https://nextjs.org/docs/app/getting-started/installation) and [Next MCP](https://nextjs.org/docs/app/guides/mcp)
- [Tailwind v4 PostCSS](https://tailwindcss.com/docs/installation/using-postcss)
- [shadcn Next setup](https://ui.shadcn.com/docs/installation/next), [theming](https://ui.shadcn.com/docs/theming), [components config](https://ui.shadcn.com/docs/components-json), [MCP](https://ui.shadcn.com/docs/mcp)
- [Claude memory imports](https://code.claude.com/docs/en/memory), [skills](https://code.claude.com/docs/en/skills), [subagents](https://code.claude.com/docs/en/sub-agents), [settings](https://code.claude.com/docs/en/settings), [permissions](https://code.claude.com/docs/en/permissions), [MCP](https://code.claude.com/docs/en/mcp), [plugins](https://code.claude.com/docs/en/discover-plugins)
- [Context7 MCP source](https://github.com/upstash/context7/tree/master/packages/mcp), [client setup](https://context7.com/docs/resources/all-clients)
- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)
- Package existence/version/peer ranges checked with `npm view <package> version` and install's peer validation; no package names inferred from memory.
