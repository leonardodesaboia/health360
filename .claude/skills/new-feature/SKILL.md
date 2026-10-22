---
name: new-feature
description: Recipe for building a feature slice in the Health360 Next.js app, covering feature folder layout, Server vs Client Components, src/server boundaries, Zod contracts, tests, and which docs to update. Use when adding or extending a feature, route, server action, route handler, domain module, or contract in Health360.
---

# Health360 new-feature recipe

Use this skill for *how to structure* code. For the end-to-end task loop (pick a task, plan, TDD, verify, review, PR), use the `implement-task` skill. It calls this one.

## 1. Orient

- Read `ARCHITECTURE.md` (structure, boundaries, trust model) and the assigned task's acceptance criteria.
- Inspect the code you will touch and its tests: `src/features/<feature>`, `src/app/...`, and `src/components/...`.
- This is Next.js 16 with React 19, Tailwind 4, and Zod 4. APIs may differ from your training data. Read the matching guide in `node_modules/next/dist/docs/` (or query Context7 or the Next.js devtools docs tool) before you write framework code.

## 2. Place code by responsibility

| Concern | Location | Rule |
| --- | --- | --- |
| Route composition, metadata, layouts | `src/app/**` | Thin. Composes features and components. No domain logic. |
| Domain contracts, pure logic, feature UI | `src/features/<feature>/` | Zod schemas and inferred types, pure functions, colocated `*.test.ts`. Create the folder only when it holds real code. |
| Shared UI | `src/components/{ui,layout,shared}` | Presentational only. No DB access, provider calls, or clinical decisions. |
| Server-only adapters (DB, LLM, clinical rules) | `src/server/<area>/` | First line `import "server-only";`. Never imported by a client component. Create only when the task authorizes that layer. |
| Small utilities | `src/lib/` | Generic helpers only. |

Don't create empty directories, placeholder services, speculative abstractions, or global stores.

## 3. Server vs client

- Default to **Server Components**. Add `"use client"` only to the smallest interactive island (form state, navigation state, disclosure).
- Mutations go through Server Actions or route handlers that **validate input with Zod on the server** and re-check authorization, ownership, and version freshness. Client-side validation is UX only.
- Secrets and provider config stay in server env. Never put them in `NEXT_PUBLIC_*`, and never pass them as props.

## 4. Contracts and data

- Validate every external input (forms, params, model output, fixtures) with Zod at the boundary.
- Represent unknown values explicitly (`null` plus a missing-information list). Never coerce unknown to false. See the `clinical-safety` skill.
- Extend the contracts in `src/features/patients/contracts.ts` (or the owning feature) rather than duplicating shapes. Keep domain logic out of JSX.
- Synthetic fixtures are parsed at load and never mutated.

## 5. Tests (write them first)

- **Unit (Vitest)** for pure logic, schemas, and transitions. Colocate as `*.test.ts`. Cover acceptance criteria **and** failure paths (invalid input, unknown data, illegal transition, blocked state).
- **E2E (Playwright, `tests/e2e/`)** when a user-visible flow becomes functional. Use roles and labels for selectors, and test both desktop and mobile projects.
- Never simulate success in production code to satisfy a test, and never weaken a gate.

## 6. Docs to update in the same change

- `ARCHITECTURE.md` when you add a layer, boundary, or env var (also `.env.example`).
- `USER_FLOWS.md` when you change a journey or state.
- `COMPONENT_GUIDELINES.md` and `/showcase` for a new or changed shared component.
- `DESIGN_GUIDELINES.md` for a new token, with its contrast ratio.
- Backlog or spec status with evidence (see `implement-task`).

## 7. Finish

Run the `verify` skill. For UI changes, also apply the `design-system` checklist. For anything clinical, apply the `clinical-safety` checklist.
