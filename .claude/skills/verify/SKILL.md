---
name: verify
description: Runs the Health360 definition-of-done checks (pnpm verify, pnpm test:e2e, pnpm format:check, strict OpenSpec validation) and reports the real results. Use before claiming any Health360 task is done, before committing or opening or updating a PR, after rebasing, and whenever asked to verify, check, or validate the repo.
---

# Health360 verification

Evidence before claims. Don't say "passes", "done", or "fixed" without fresh command output from this working tree.

## Commands (from the repo root)

Run them in this order and stop at the first failure.

```sh
pnpm verify          # eslint --max-warnings=0, next typegen + tsc --noEmit, vitest run, next build
pnpm test:e2e        # Playwright desktop + mobile Chromium against a production build (port 3100)
pnpm format:check    # Prettier
pnpm exec openspec validate --all --strict --no-interactive   # OpenSpec artifacts
```

- One-time setup when Playwright browsers are missing: `pnpm exec playwright install chromium`.
- On Windows PowerShell with a restrictive execution policy, use `pnpm.cmd` instead of `pnpm`.
- If dependencies changed or `node_modules` is missing, run `pnpm install --frozen-lockfile` first.
- The authoritative script definitions are in `package.json`. If they changed, follow them.

## On failure

1. Read the first error, not the last. Find the root cause before you edit anything; don't guess-patch.
2. Fix the cause with the smallest correct change. Never:
   - delete, skip, or `.only` tests;
   - loosen lint or TS config, or add `eslint-disable` or `@ts-expect-error` to silence a real problem;
   - weaken a clinical gate or assertion.
3. If formatting fails, run `pnpm format`, then re-run `pnpm format:check`.
4. Re-run the **full** sequence after a fix, not just the failing step.
5. If a failure is pre-existing and outside your task, confirm it on a clean checkout of the base branch. Report it with the output and don't silently fix unrelated code.

## UI and clinical extras (when the change touches them)

- UI: check the changed screens at about 390 px and desktop width, use keyboard-only navigation, and confirm no horizontal overflow. See the `design-system` skill.
- Clinical or AI paths: confirm the failure and blocked-state tests exist and ran. See the `clinical-safety` skill.

## Report format

```text
Verification (<branch> @ <short sha>)
- pnpm verify: PASS | FAIL (<first error excerpt>)
- pnpm test:e2e: PASS (N passed) | FAIL (...)
- pnpm format:check: PASS | FAIL
- openspec validate --strict: PASS | FAIL
- Manual checks performed: <list, or "none">
- Not verified: <anything skipped, and why>
```

Paste real excerpts. If a step could not run (missing browser, network, secret), say so explicitly.
