# Health360

AI-implementation-ready foundation for a preventive-care coordination prototype.
**Synthetic demonstration only. No clinical validation or real patient use.**

## Run locally

Requires Node 24 and pnpm 10.34.5. In Windows PowerShell with script restrictions,
substitute `pnpm.cmd` for `pnpm`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:3000/patient. Also inspect `/patient/intake`, `/patient/plan`,
`/doctor`, `/doctor/reviews/demo-review-01` and `/showcase`.
No environment variables, database or API account are needed for the foundation.
`.env.example` reserves provider-agnostic **server-only** variables for a future task;
they are not read by this application. Never use a `NEXT_PUBLIC_` key variable.

## Verify

```sh
pnpm verify
pnpm exec playwright install chromium
pnpm test:e2e
pnpm format:check
node scripts/contrast.mjs
pnpm exec openspec validate --all --strict --no-interactive
```

`verify` runs lint → route type generation / strict TypeScript → Vitest → production
build. E2E runs separately against the production build and starts its own loopback
server on port 3100. Keep that port available. CI runs the same verify and smoke commands.
On Linux, install browser OS dependencies with `pnpm exec playwright install --with-deps chromium`.

## Start an implementation task

Read [AGENTS.md](AGENTS.md), then choose an authorized task from the
[canonical ordered implementation index](docs/backlog/IMPLEMENTATION.md). Claude reads the same instructions
through [CLAUDE.md](CLAUDE.md). Recipes and MCP activation are in
[AI tooling](docs/ai/TOOLING.md).

## What is delivered

Next.js App Router, React, strict TypeScript, Tailwind v4 semantic tokens,
shadcn-compatible source-owned primitives, Geist, Lucide, a small RHF/Zod example,
responsive patient/doctor shells, reference screens, framework-free workflow graph,
Zod contracts for ten core entities, synthetic fixtures, Vitest and Playwright.

The home and review queue are reference patterns. Intake is read-only, review controls
are disabled, and no plan is generated. The demo role links provide **no authorization**.
There is no persistence, LLM provider, rules engine, timeline engine or medical validation.

## Documentation map

- [Architecture and trust boundaries](ARCHITECTURE.md)
- [Design tokens, geometry and measured contrast](DESIGN_GUIDELINES.md)
- [Shared components and composition](COMPONENT_GUIDELINES.md)
- [Navigation and workflow transitions](USER_FLOWS.md)
- [Full original product context, future work](docs/product/PRODUCT_CONTEXT.md)
- [Canonical ordered index and flows A–E](docs/backlog/IMPLEMENTATION.md)
- [Per-task OpenSpec workflow](openspec/README.md)
- [Hybrid workflow adoption decision](docs/adr/0002-spec-driven-workflow.md)
- [Spec → plan → TDD → verify → review workflow](docs/ai/WORKFLOW.md)
- [Tooling sources, plugin inventory and enablement](docs/ai/TOOLING.md)
- [Foundation decisions](docs/adr/0001-foundation.md)
