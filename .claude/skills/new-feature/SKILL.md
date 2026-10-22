---
name: new-feature
description: Implement an assigned Health360 backlog slice with feature ownership, server boundaries, validation and focused verification.
---

1. Read AGENTS.md, ARCHITECTURE.md and the assigned task in docs/backlog/IMPLEMENTATION.md. Check dependencies and keep unrelated MVP requirements deferred.
2. Inspect the existing feature, contracts and tests. State acceptance criteria and a short plan.
3. Place domain schemas/functions/tests in src/features/<feature>. Compose routes in src/app and reuse src/components. Create directories only for real code.
4. Prefer Server Components. Limit client islands to form/navigation interactions. Future DB/provider adapters go under src/server with server-only boundaries; never import them from client components.
5. Validate external inputs with Zod and represent unknown data explicitly. Keep domain logic out of JSX.
6. Write meaningful acceptance and failure-path tests. Add end-to-end coverage when a user flow becomes functional. Do not simulate success in production code to satisfy tests.
7. Update the relevant doc and backlog status with evidence. Run pnpm verify, pnpm test:e2e and pnpm format:check. Inspect changed UI responsively and with a keyboard.
8. Report implemented scope, exact results, limitations and any clinical-owner decisions still required. Follow the user's commit/publishing scope.
