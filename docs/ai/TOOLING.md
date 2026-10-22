# AI tooling index

[AGENTS.md](../../AGENTS.md) is the harness-neutral project policy. Follow its
spec → plan → TDD → verify → review workflow; do not maintain another backlog.

| Need                                                                                                     | Canonical source                                                                  |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Claude Code setup, skills, agents, MCP and permissions                                                   | [claude-code.md](claude-code.md)                                                  |
| Codex setup, skill discovery, MCP and review configuration                                               | [codex.md](codex.md)                                                              |
| ECC/OpenSpec/superpowers adoption, Spec Kit comparison, specialist map and verified marketplace commands | [WORKFLOW.md](WORKFLOW.md)                                                        |
| Ordered MVP requirements, dependencies and unchecked implementation tasks                                | [OpenSpec backlog](../../openspec/README.md)                                      |
| Current implemented behavior                                                                             | [Foundation spec](../../openspec/specs/foundation/spec.md)                        |
| Product context and exclusions                                                                           | [PRODUCT_CONTEXT.md](../product/PRODUCT_CONTEXT.md)                               |
| Run and verify the foundation                                                                            | [README.md](../../README.md)                                                      |
| Architecture and dependency decisions                                                                    | [ARCHITECTURE.md](../../ARCHITECTURE.md), [ADR](../adr/0001-foundation.md)        |
| Shared UI conventions                                                                                    | [Design](../../DESIGN_GUIDELINES.md), [components](../../COMPONENT_GUIDELINES.md) |

The harness documents and configurations are delivered by their separately reviewed
Claude/Codex tooling PRs. Their links are intentional handoff targets until those
PRs merge. No companion commits are included in the foundation PR.

The common workflow uses portable Markdown and the pinned OpenSpec CLI without
requiring plugins. Installed-machine inventory and adoption limits are documented
in WORKFLOW.md; installation alone does not imply enabled state. Never modify or
commit AO-managed `.claude/settings.local.json`.
