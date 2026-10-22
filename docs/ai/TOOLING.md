# AI tooling index

Start with [AGENTS.md](../../AGENTS.md). This page routes to canonical guidance;
it is not another workflow, backlog or copy of provider-specific instructions.

| Need                                                                                          | Canonical source                                                                               |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Adopted workflow, research, ECC/superpowers map, Spec Kit comparison and marketplace commands | [WORKFLOW.md](WORKFLOW.md)                                                                     |
| Ordered MVP changes, dependencies, requirements and unchecked task status                     | [OpenSpec backlog](../../openspec/README.md)                                                   |
| Current implemented behavior                                                                  | [Foundation baseline spec](../../openspec/specs/foundation/spec.md)                            |
| Product background and clinical exclusions                                                    | [Product context](../product/PRODUCT_CONTEXT.md)                                               |
| Claude project entry point                                                                    | [CLAUDE.md](../../CLAUDE.md), importing AGENTS.md                                              |
| Project recipes and engineering reviewers                                                     | [AGENTS.md recipes](../../AGENTS.md#recipes-and-review), `.claude/skills` and `.claude/agents` |
| Project MCP definitions                                                                       | [.mcp.json](../../.mcp.json)                                                                   |
| Shared Claude permissions                                                                     | [.claude/settings.json](../../.claude/settings.json)                                           |
| Run, verify, smoke tests and future environment configuration                                 | [README.md](../../README.md)                                                                   |
| Server/client and future AI boundaries                                                        | [ARCHITECTURE.md](../../ARCHITECTURE.md)                                                       |
| Dependency compatibility decisions                                                            | [Foundation ADR](../adr/0001-foundation.md)                                                    |
| Tokens, measured contrast and shared UI                                                       | [Design](../../DESIGN_GUIDELINES.md), [components](../../COMPONENT_GUIDELINES.md)              |

The separately reviewed Claude and Codex integration PRs add their own provider
setup documentation here after rebasing on the foundation. Do not copy their drafts
into this PR or assume Claude plugins are automatically available in Codex.
The common workflow and canonical backlog above work as Markdown/CLI without them.

## Baseline integrations

The baseline `.mcp.json` pins verified commands: shadcn 4.22.1 (`mcp`),
next-devtools-mcp 0.4.0, Playwright MCP 0.0.83 (`--headless`) and Context7 MCP 4.4.4.
They need network access for initial package download; Next runtime inspection
needs `pnpm dev`. Check the client's MCP connection list after deliberately trusting
the servers. Context7 supports `CONTEXT7_API_KEY` for authenticated queries/higher
limits; never commit it. Avoid enabling duplicate Context7/Playwright plugin and
project servers. Authenticated MCP queries have not been verified by setup.

Installed-machine inventory at setup: superpowers, ecc, context7, playwright,
frontend-design, code-review and feature-dev. Installation is not proof of enabled
state. No plugins or global settings were changed by this foundation. Verified
new-machine install commands and adoption limits live in WORKFLOW.md.

The shared settings have no hooks and a narrow verification/read-command allowlist.
Preserve AO-managed `.claude/settings.local.json` and `.claude/.gitignore`.
For AO's visible Browser panel use `ao preview` / `ao browser`; Playwright MCP and
production smoke tests use separate browser runtimes.

## Framework/config primary sources

- [Next installation](https://nextjs.org/docs/app/getting-started/installation) and [Next MCP](https://nextjs.org/docs/app/guides/mcp)
- [Tailwind v4 PostCSS](https://tailwindcss.com/docs/installation/using-postcss)
- [shadcn setup](https://ui.shadcn.com/docs/installation/next), [theming](https://ui.shadcn.com/docs/theming) and [MCP](https://ui.shadcn.com/docs/mcp)
- [Claude imports](https://code.claude.com/docs/en/memory), [skills](https://code.claude.com/docs/en/skills), [review agents](https://code.claude.com/docs/en/sub-agents), [permissions](https://code.claude.com/docs/en/permissions) and [plugins](https://code.claude.com/docs/en/discover-plugins)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp), [Context7 MCP](https://github.com/upstash/context7/tree/master/packages/mcp)
