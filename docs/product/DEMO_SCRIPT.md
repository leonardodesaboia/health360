# HISIC 2026 demonstration script — part 1

**Presentation: November 3, 2026. DEMONSTRATIVE — NOT CLINICALLY VALIDATED.**

Use fictional people and synthetic records only. This rehearsal demonstrates
software behavior, not clinical accuracy, efficacy, diagnosis or medical approval.
The demonstration role switch is navigation, not authentication.

## What this rehearsal proves

| Segment              | Part-1 coverage                                                                                                             | Limit                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| A — First evaluation | Browser case selection, real intake submission, persisted profile, mock analysis, patient plan gate, physician queue/reader | Stop before physician decisions and finalization (P0-10).                                 |
| B — Do Not Test      | Existing demonstrative scenario and proposal traceability can be inspected                                                  | Full physician decision-to-plan acceptance remains deferred.                              |
| C — Clarification    | Explain the missing-information state                                                                                       | Questions, answers and reanalysis acceptance await P0-12; do not present them as working. |
| D — Reassessment     | Start an update from a **fixture-reviewed** plan and preserve plan v1                                                       | Fixture setup does not prove review UI; plan v2 acceptance remains deferred.              |
| E — AI failure       | Inject a failure at the mock-provider boundary, show blocked analysis, retry through the browser, preserve failure history  | This is a controlled test fault, not a live provider outage.                              |

P0-14 is **in progress**. This first part does not establish all 18 product
acceptance points or complete A–E journeys. Deferred cases use `test.fixme` with
dependency TODOs; report them separately from passed tests.

## Before opening the demonstration

1. Record the release commit and use a PostgreSQL database containing only synthetic
   demonstration data. Apply the committed migrations with `pnpm db:migrate`.
2. Use Node 24 and pnpm 10.34.5. Install the locked dependencies and Chromium:
   `pnpm install --frozen-lockfile` and `pnpm exec playwright install chromium`.
3. Force offline model mode with `LLM_PROVIDER=mock`, `LLM_MODEL=deterministic-v1`
   and `LLM_LIVE_SMOKE=0`. No API key is needed. The database is still required.
   Keep connection URLs and keys out of the browser, screenshots and presentation.
4. Build the production application with `pnpm build`, then start it with
   `pnpm start --port 3210` for this worker's local rehearsal. Use the actual
   deployed origin for the presentation; local verification does not verify VPS/TLS.
5. Open `/patient` in a fresh browser context. Confirm the English interface,
   demonstration banner and **DEMONSTRATIVE — NOT CLINICALLY VALIDATED** label.
   Select the case deliberately; do not infer a logged-in identity from a URL.

For deployment preparation and HTTPS cookie settings, use the existing
[Easypanel runbook](../deploy/easypanel.md). Do not start a second server on an
occupied port or stop another worker's process/container.

## Opening statement — about 30 seconds

“Health360 demonstrates a preventive follow-up workflow using fictional cases.
The rules determine the restricted demonstration scope; a replaceable language
model explains the supplied findings. Every proposal is preliminary. Physician
review and explicit finalization are required before a patient plan is available.
Today we are using deterministic mock output, not a live model call.”

## Flow A — from the patient to the physician queue

1. On `/patient`, choose **Alex Example**. The header must say **Demo case: Alex
   Example**. If rehearsing again, use **Reset demo** in this browser first.
2. Open **View my history** or `/patient/intake`. Enter the following explicitly;
   the answers are a prepared synthetic case, not inferred patient facts:

   | Step              | Synthetic answer                                                                                                                                 |
   | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
   | Basic information | Age **50**.                                                                                                                                      |
   | Clinical history  | **No** to every displayed symptom, personal-risk and family-risk question. Clear the medications **I don't know** checkbox, then enter **None**. |
   | Habits            | Currently smoking **No**; regular physical activity **Yes**.                                                                                     |
   | Previous exams    | Previous colorectal screening **Never screened**.                                                                                                |

3. Use **Save and continue** between steps. On **Review answers**, use **Edit basic
   information**, confirm the saved age, then return through the steps. This is an
   actual edit/navigation path, not a simulated saved-state label.
4. Check **I confirm these synthetic answers and want to save my profile.** Click
   **Confirm and save profile**. The selected demo stores the new profile version
   and opens `/patient/analysis`. Reload to show that the administrative state
   survives refresh.
5. Click **Analyze current profile**. Wait for **Awaiting physician review**.
   Explain: “The deterministic rule supplied a restricted preliminary finding.
   The model cannot add evidence, change the rule outcome or publish a plan.”
6. Open `/patient/plan`. There must be no **Selected actions** section and no
   preliminary proposal presented as patient guidance.
7. Switch to `/doctor`. Show the selected patient's queue entry, real stored
   analysis timestamp and administrative stage. Open **Open review**. Read the
   patient context and disclose the rationale/evidence as available. Public sources
   are traceable support, not medical validation.
8. **Stop here for part 1.** Do not imply that selecting an item, changing roles
   or opening the workspace completes physician review. Actual decision reasons,
   finalization and the resulting patient plan await P0-10 acceptance.

## Flow B — explaining the repeat-screening case

For a separate rehearsal, choose **Jordan Example**; selection replaces only this
browser's dataset. The prepared story is age **60**, no listed symptoms or risk
exclusions, and a reported normal colonoscopy on **November 3, 2022**, complete to
the cecum with adequate preparation. Enter each fact explicitly in intake.

The restricted rule can produce a **possible redundancy** proposal. In the
physician workspace inspect its rule ID/version, considered examination data,
limitations and versioned evidence. Say “possible” and explain that report quality,
indication, symptoms and risk matter; a recent examination alone is insufficient.
This is preliminary and does not tell the patient to cancel or avoid a test.

Source definitions and demonstration limits are in
[the scenario pack](DEMO_SCENARIOS.md). Full decision-to-plan coverage is deferred.

## Flow C — reserved for clarification acceptance

An unknown age or required examination fact must stay unknown and produce an
explicit missing-information state. Never replace “I don't know” with “No,” a
normal result or an invented date to make a demonstration proceed.

**TODO(P0-12):** once the real question/answer flow lands, rehearse the restricted
English question, **I don't know**, a new immutable profile version and guarded
reanalysis. A remaining unknown must continue to block the unsupported finding.
This is not a chatbot. The part-1 script does not claim this journey is complete.

## Flow D — start an update while preserving the earlier plan

This segment currently uses the existing synthetic reviewed-cycle fixture in the
acceptance test. Its stored demo review is **not real medical validation** and does
not prove the unfinished P0-10 decision UI. Run the acceptance case for a reproducible
rehearsal; do not silently substitute its fixture setup for a live physician review.

1. With the fixture-reviewed plan v1 selected, open `/patient/history` and show
   **View plan version 1**.
2. Activate **Update my information**. Confirm that real reassessment opens the
   intake form with the prior age loaded.
3. Open `/patient/plan` and show **Previous reviewed plan**. Reload: the old plan
   remains preserved. The history records **Reassessment requested**; no new plan
   or second review has been created by starting the update.
4. **TODO(P0-10, P0-12):** complete the updated profile, new analysis, actual review
   and plan v2, then compare both preserved plan versions. Part 1 stops before this.

## Flow E — controlled failure and safe retry

The acceptance suite begins with a real browser-confirmed intake. Its test-only
runner invokes the real analysis service and adapter with a mock timeout, API error,
malformed output, unsupported category, unknown evidence or insufficient support.
There is no public failure-injection endpoint or production success stub.

1. Open the failed case at `/patient/analysis`: expect the analysis-not-completed
   stage, a bounded English message and **Retry analysis**.
2. Show that the patient plan remains unavailable. Raw model output, injected
   evidence IDs, keys and stack traces must not appear as patient content.
3. Click **Retry analysis** with the application still configured for mock mode.
   Expect **Awaiting physician review**, not a published plan.
4. The acceptance test checks persisted storage: the blocked attempt remains,
   exactly one successful preliminary analysis is added, and no review or plan is
   manufactured. Refresh does not create another successful analysis.

Say: “The failure was deliberately injected into a test provider. The application
failed closed and required a fresh validated result. A successful retry still
requires physician review.” Do not describe this as a live OpenAI outage/recovery.

## Reset and recovery

- **Reset demo** restores the current browser's selected case, including its
  profile/analysis history. Rehearsal tests verify that a second independent browser
  context remains unchanged. Do not reset a case whose history you still need.
- If analysis is blocked, keep the explicit state visible and use the implemented
  retry or correct the underlying input. Never bypass a workflow transition,
  fabricate evidence or show an old plan as a newly approved result.
- If PostgreSQL is unavailable, restore the demo's database connection and retry.
  Do not delete volumes, reset migrations or truncate shared data for rehearsal.
- Keep the last reviewed release and its database backup available. Deployment
  rollback/restoration is an operator procedure, not a claim made by local tests.

## Running and reporting the acceptance suite

Set `DATABASE_URL` and `TEST_DATABASE_URL` to the **same disposable PostgreSQL
database** used by the test application; never use real patient storage. Set
`LLM_PROVIDER=mock`, `LLM_MODEL=deterministic-v1`, `LLM_LIVE_SMOKE=0`, and
`DEMO_COOKIE_SECURE=false` for local HTTP. Apply migrations before the first run.

```powershell
$env:PORT = '3210'
pnpm.cmd verify
pnpm.cmd test:e2e
pnpm.cmd format:check
pnpm.cmd exec openspec validate --all --strict --no-interactive
```

To focus on this part after a production build, run
`pnpm.cmd test:e2e tests/e2e/acceptance`. Playwright starts and stops its own
production server on PORT=3210. Do not run another server on that port concurrently.
Both desktop and mobile projects execute these tests. Each acceptance test owns
an isolated synthetic dataset and removes only its own data during teardown.

Record the tested commit, commands, actual passed/failed/fixme counts and unverified
stages. Do not present fixed-up or skipped cases as passing. The full P0-14 change
remains open until all required A–E stages and acceptance points are covered.

A live provider connectivity check is separate: it requires explicit authorization,
synthetic inputs, server-side OpenAI configuration and the opt-in `LLM_LIVE_SMOKE=1`
flag. CI skips that check. Mock acceptance proves deterministic software behavior;
neither mock nor live connectivity establishes clinical validity.
