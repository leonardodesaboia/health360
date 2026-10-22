# ADR 0001 — A foundation with explicit clinical boundaries

Status: accepted for foundation setup, 2026-10-22.

Use one Next.js app with Server Components and feature-owned contracts. This keeps
route composition simple and avoids an unnecessary service/microservice split.
The strict TypeScript/Zod boundary supports later persistence and provider adapters.
Tailwind v4 CSS semantic variables and source-owned shadcn composition keep changes
reviewable and consistent. Bundle Geist locally to avoid build-time font downloads.

No database, LLM calls, rules, decision persistence or plan/timeline engine in this
phase. Read-only synthetic references make the foundation copyable without falsely
implying complete clinical behavior. Workflow adjacency stays pure and framework-free;
future server services own authorization and medical-review publication gates.

Versions were checked against npm and official documentation. Next 16.4.2 / React
19.3.1 / Tailwind 4.3.3 are current stable at setup. TypeScript 6.0.3 and ESLint 9.39.5
are selected for the installed lint plugins' declared peers; latest majors 7/10 are
not yet compatible. ESLint 9 is upstream deprecated; upgrade the lint stack together
when Next's plugins support ESLint 10. No peer override or warning suppression.
Node types stay on major 24 to match runtime. Lockfile fixes the full resolved tree.

Project MCP versions are pinned to verified releases. Shared settings add a narrow
script/read allowlist and no hooks, preserving AO local hooks. User-installed plugins
remain optional; do not enforce machine-specific plugin enables in shared settings.
Canonical guidance is AGENTS.md imported by a thin CLAUDE.md, with plain Markdown
recipes usable by other coding agents without duplicated instruction trees.
