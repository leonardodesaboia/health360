# Acceptance tests

Apply root AGENTS.md. `tests/e2e/` covers the implemented foundation; product flows
A–E in the backlog are future acceptance specifications, not existing functionality.

- Exercise observable behavior with accessible locators and synthetic fixtures.
  Do not depend on external LLMs, real records, arbitrary timeouts or test ordering.
- The Playwright configuration owns its production server, base URL and viewports.
  Run `pnpm verify` to build before `pnpm test:e2e`; use the configured test server.
- Preserve desktop/mobile route, keyboard and demo-boundary coverage. A disabled
  review control must stay disabled until real server-backed behavior is assigned.
- For later implemented flows, cover missing data, invalid evidence, API failure,
  stale versions and incomplete review blocking publication. Do not fabricate
  passing clinical output or replace actual assertions with snapshots alone.
- Domain unit tests stay beside their feature. Passing tests establish software
  behavior, never clinical validity or a complete accessibility audit.
