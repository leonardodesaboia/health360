## Implementation

- [x] 1. Define language delta contracts and add English regression coverage.
- [x] 2. Translate product copy and fixtures with explicit English locale formatting.
- [x] 3. Translate documentation and guidance, add ADR0004 and synchronize skills.
- [x] 4. Verify, inspect responsive and keyboard behavior and review.

After verification, archive the change, rebase, publish the PR to main, request
native review and report the results through AO.

## Evidence

Focused regression: `pnpm test src/lib/format.test.ts` passed, 3 tests. The first
attempt was blocked by missing dependencies; the initial installed run exposed an
unsupported Vitest path alias, corrected to relative imports. No red-to-green
behavioral test run is claimed. Existing browser assertions were translated and
extended for document language, safety labeling and the displayed English date.

Verification on 2026-10-22 (local date), Node 24.19.0 / pnpm 10.34.5:

- `pnpm verify`: exit 0; skill copies checked (13), skill-sync tests 6 passed,
  ESLint passed, strict typecheck passed, Vitest 3 files / 128 tests passed,
  Next.js production build passed (9 static pages).
- `PORT=3166 pnpm test:e2e`: exit 0; 22 passed (1.8m), desktop and mobile Chromium.
  English routes/banner/HTML language, US date, unknown-review 404, disabled
  approval, unavailable plan, form feedback, keyboard focus, overflow and
  serious/critical axe checks passed.
- `pnpm format:check`: exit 0, all matched files use Prettier code style.
- `pnpm exec openspec validate --all --strict --no-interactive`: exit 0,
  4 passed / 0 failed before archive.
- `git diff --check`: passed.

Applied spec-conformance, TypeScript/React, clinical-safety and design checklists
inline; no separate specialist reviewer is claimed. Existing entity contracts and
workflow edges are unchanged. Unknowns, preliminary-output restrictions and role
navigation disclaimers remain explicit. Product context retains all 22 sections
and 18 future acceptance criteria. Only language wording changes in the backlog;
no other worker's status or links were modified.

Archive: `pnpm exec openspec archive en-language-switch --yes` completed with
checks enabled, promoting 5 modified requirements into the 3 baseline specs.
Post-archive strict validation: 3 passed / 0 failed. Main rebase reported the
branch already up to date and restored the translation autostash successfully.

Limits: responsive/keyboard inspection was automated through Playwright. The AO
Browser initially timed out, then recovered enough to read the English patient
page snapshot with no reported page errors. Its role-switch postcondition was
unmet and screenshot capture returned `SCREENSHOT_UNAVAILABLE`; the same journey
passed in both Playwright projects. No manual visual or assistive-technology audit
or clinical validation is claimed. Native AO review will run after PR publication.
