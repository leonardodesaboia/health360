## Implementation

- [x] 1. Extend additive typed contracts and conditional configuration; write failing projection/unknown tests then implement.
- [x] 2. Extend repository ports and atomic idempotent local completion; test stale/concurrent edits, immutable history, refresh and storage failure.
- [x] 3. Implement review/edit/confirm and consolidated profile route; test desktop/mobile completion, focus and unknown display.
- [x] 4. Verify, review clinical/design/spec boundaries inline, record real evidence.

## Verification evidence (2026-10-23)

- `pnpm verify`: lint and typecheck clean; Vitest 225 passed, 1 skipped (the opt-in live AI smoke test); production build OK.
- `PORT=3110 pnpm test:e2e`: 36 passed (desktop and mobile Chromium, including axe accessibility).
- `pnpm format:check` clean; `pnpm exec openspec validate --all --strict --no-interactive`: 9 passed.
- Canonical values: completed colonoscopy results emit `Normal` or `Abnormal`. `evaluator-handoff.test.ts` maps a completed repeat-screening intake through the agreed aggregation to the P0-05 evaluator, which returns `READY_FOR_REVIEW` with `POSSIBLE_REDUNDANCY`.
- Progress bar uses the semantic `bg-muted` and `bg-primary` tokens with `role="progressbar"`.

Release bookkeeping: archive and open PR to main without merging.
