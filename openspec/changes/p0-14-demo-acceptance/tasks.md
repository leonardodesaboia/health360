## Part 1

- [x] 1. Write the 5–7 minute English judge walkthrough from implemented controls, with disclaimers, pre-demo checklist, recovery and mock fallback.
- [x] 2. Add acceptance Flow A through approval and published plan, and Flow E failure/retry, with isolated dataset cleanup and persistence assertions.
- [x] 3. Add Flow B (possible redundancy, traceability, modification) and Flow C (unknown examination date, answered or unknown) journeys.
- [x] 4. Add Flow D start and full second review cycle (plan v2 with v1 preserved); remove the P0-10/P0-12 test.fixme placeholders.
- [ ] 5. Run pnpm verify, PORT=3210 pnpm test:e2e, pnpm format:check and strict OpenSpec validation; record real results and open the PR to main.

## Remaining P0-14

- [ ] 6. Audit all 18 product acceptance points against the suite, rehearse the timed walkthrough on the release build, then archive P0-14 with fresh evidence.
