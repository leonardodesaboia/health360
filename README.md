# Health360

Preventive-care coordination prototype for the HISIC demo on November 3, 2026.
**Synthetic demonstration only. No clinical validation or real patient use.**
UI, scenarios and docs use US English and en-US formatting ([ADR0004](docs/adr/0004-english-language.md)).

Intake, persisted analysis, patient clarification and the physician reader work
together. Physician decisions and finalization remain in progress; a new case cannot yet complete
the full patient-to-plan cycle. See [current status](docs/STATUS.md).

## Getting started

Install Node **24**, pnpm **10.34.5** (pnpm 10), and Docker Desktop with its Linux
engine running. In restricted Windows PowerShell substitute `pnpm.cmd` for `pnpm`.

```sh
pnpm install --frozen-lockfile
```

Copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell,
`cp .env.example .env` in a POSIX shell). Before starting Postgres, edit:

```dotenv
POSTGRES_PORT=5447
DATABASE_URL=postgresql://health360:health360_dev_only@127.0.0.1:5447/health360
TEST_DATABASE_URL=postgresql://health360:health360_dev_only@127.0.0.1:5447/health360_tests
LLM_PROVIDER=mock
LLM_MODEL=deterministic-v1
DEMO_COOKIE_SECURE=false
```

Preserve the other template values. The committed template and Compose fallback
still use **5432**; **5447** is the agreed local override because 5432 is occupied.
These credentials are disposable local defaults only. Never commit `.env` or use
`NEXT_PUBLIC_*` for database credentials or API keys.

```sh
pnpm db:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://127.0.0.1:3000/patient. Migrations apply committed SQL using
`prisma migrate deploy`. Seed creates the separate `local-synthetic-demo` storage
dataset without analysis or publication; it does **not** select a browser case.
Selecting a case in the header creates that browser's dataset and clinical context.

## Demo walkthrough and current stopping points

1. In **Choose demo case**, select Alex (`first-screening`) or Jordan
   (`repeat-screening`). Patient and physician pages in the same browser share it.
   The restricted CRC scenarios are **DEMONSTRATIVE — NOT CLINICALLY VALIDATED**.
2. Open `/patient/intake`, review the available prefilled synthetic information, save drafts,
   navigate the steps and explicitly confirm. Drafts remain browser-local; confirmed
   submissions persist to Postgres. Unknown answers stay unknown.
   Submission stores a profile version and opens `/patient/analysis`.
3. Run analysis there. Mock produces preliminary explanations without OpenAI access.
   Alex's complete no-prior-screening case supports a preventive opportunity;
   Jordan's normal, complete, adequately prepared 2022 colonoscopy supports a
   **possible** redundancy proposal. Missing required data routes to clarification (see below);
   excluded cases and provider failures block analysis.
4. Switch to `/doctor`, open the analysis entry, and inspect the analyzed profile,
   criteria, evidence and uncertainty. **The current workspace is a reader:**
   decision saving and explicit finalization remain P0-10 work in progress.
5. Open `/patient/plan`. A fresh case has no published plan. The guarded reader can
   display an existing finalized reviewed plan, but this walkthrough cannot create
   one until P0-10 lands. Never manufacture a review to bypass publication gates.
6. `/patient/history` shows recorded events and existing reviewed versions. From an
   existing reviewed plan, updating information starts reassessment and prefilled
   intake. Plan v2 still requires analysis and a new finalized review.
7. **Reset demo** restores only this browser's selected case, removing its saved
   workflow records. Selecting another case also replaces this dataset. Other
   browser sessions remain separate. Clearing cookies alone does not delete data.

For the prepared happy path, enter the synthetic scenario explicitly: age 50
(Alex) or 60 (Jordan), No for the listed symptom and personal/family risk questions,
and Never screened for Alex. For Jordan select Colonoscopy, exact date
`2022-11-03`, result `Normal`, and Yes for normal/complete/adequate preparation.
Selection seeds profile/exam records but does not seed all typed intake answers or
restore the examination date into the form; inspect and complete those fields.
Other missing answers remain explicitly unknown rather than inferred from narrative
history. These are fictional demonstration inputs, not medical advice.

If analysis needs more information, `/patient/analysis` links to
`/patient/clarification` (bounded questions, each with I don't know); answers create
a new profile version and rerun analysis. Physician decisions and finalization
(P0-10) and the complete A–E rehearsal suite (P0-14) are not yet available. `/showcase` is a component reference, not a clinical flow.

## Scripts and ports

| Command                                                       | Purpose                                                               |
| ------------------------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                                                    | Loopback development server, port 3000                                |
| `pnpm db:up` / `pnpm db:down`                                 | Start/wait for Postgres / stop Compose; down retains the named volume |
| `pnpm db:generate`                                            | Generate Prisma client                                                |
| `pnpm db:migrate` / `pnpm db:seed`                            | Apply committed migrations / seed synthetic storage                   |
| `pnpm lint` / `pnpm typecheck` / `pnpm test`                  | ESLint / strict types and route generation / Vitest                   |
| `pnpm build` / `pnpm start`                                   | Generate client and production build / loopback production server     |
| `pnpm verify`                                                 | Skill mirror checks/tests, lint, types, unit tests, production build  |
| `pnpm test:integration`                                       | Database tests against disposable `TEST_DATABASE_URL`                 |
| `pnpm test:e2e`                                               | Playwright desktop/mobile production tests, default port 3100         |
| `pnpm format` / `pnpm format:check`                           | Write/check Prettier formatting                                       |
| `pnpm skills:sync` / `pnpm skills:check` / `pnpm skills:test` | Generate/check/test the Codex skill mirror                            |
| `pnpm codex:check-mcp`                                        | Check configured Codex MCP inventory                                  |
| `pnpm exec openspec validate --all --strict --no-interactive` | Validate pinned OpenSpec artifacts                                    |

Postgres uses loopback **5447** with the override above (container port 5432).
Dev/start default to 3000. Playwright owns its production server at 3100; `PORT`
overrides its server and base URL together. Keep the selected port free.

## Verification

```sh
pnpm verify
pnpm exec playwright install chromium
pnpm test:e2e
pnpm format:check
pnpm exec openspec validate --all --strict --no-interactive
```

Linux browser setup may require `pnpm exec playwright install --with-deps chromium`.
DB tests need a separately created disposable database and migrations applied with
`DATABASE_URL` pointing to it; setting `TEST_DATABASE_URL` does not create it.
Default unit tests never connect to Postgres. Tests establish engineering behavior,
never clinical validity. Full flow acceptance remains P0-14.

## Troubleshooting

- **5432 occupied:** set `POSTGRES_PORT=5447` and update both URLs before `db:up`.
  Changing only the Compose port leaves Prisma connecting to the wrong server.
- **Docker engine unavailable:** start Docker Desktop, wait for the Linux engine,
  then retry `pnpm db:up`. Inspect `docker compose ps` and Postgres logs if readiness fails.
- **Database/schema errors:** confirm `.env`, port and migrations. Case selection
  requires Postgres; errors do not fall back to fixture records. Do not delete a
  volume or reset the database to conceal migration failures.
- **CRLF/formatting:** `.gitattributes` normalizes text to LF even with Windows
  `core.autocrlf=true`. Format changed docs, then run `pnpm format:check`.
- **Offline demo:** force `LLM_PROVIDER=mock`, even if a key exists. An unset provider
  defaults to mock. Explicit `openai` without a key/model fails closed; API errors
  never fall back to mock. Postgres is still required. Live OpenAI is unverified.
- **No case after seed:** choose one in the header. On local HTTP keep
  `DEMO_COOKIE_SECURE=false`; HTTPS deployments use true.
- **PowerShell blocks pnpm.ps1:** use `pnpm.cmd` without changing global policy.

## Documentation map

- [Current status, flows A–E and gaps](docs/STATUS.md)
- [Human and AI collaboration](docs/CONTRIBUTING.md) and [agent guide](AGENTS.md)
- [Architecture](ARCHITECTURE.md) and [integration contracts](docs/adr/0005-integration-contracts.md)
- [Navigation and workflow](USER_FLOWS.md)
- [Ordered implementation index](docs/backlog/IMPLEMENTATION.md) and [OpenSpec](openspec/README.md)
- [Design tokens](DESIGN_GUIDELINES.md) and [components](COMPONENT_GUIDELINES.md)
- [Product requirements](docs/product/PRODUCT_CONTEXT.md) and [scenarios](docs/product/DEMO_SCENARIOS.md)
- [AI tooling](docs/ai/TOOLING.md) and [execution workflow](docs/ai/WORKFLOW.md)
- [Runtime decisions](docs/adr/0003-mvp-runtime-decisions.md) and [deployment](docs/deploy/easypanel.md)
