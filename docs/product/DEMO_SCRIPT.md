# HISIC 2026 judge walkthrough — Health360

**Presentation: November 3, 2026 · 5–7 minutes · DEMONSTRATIVE — NOT CLINICALLY VALIDATED.**

Every step below uses controls that exist in the application and is covered by the
browser acceptance suite (`tests/e2e/acceptance/journeys.spec.ts`).

## Honesty disclaimers (say them; never soften them)

- **Synthetic data only.** Alex and Jordan are fictional; no real patient records exist.
- **Demonstrative rules, not clinically validated.** The two screening rules were
  authored for this demonstration. Software checks are not medical approval.
- **Physician review is mandatory.** Nothing reaches the patient until a physician
  explicitly decides and finalizes. The demo reviewer is not a real clinician, and the
  role switch is navigation, not authentication.
- **Real public evidence is cited.** Proposals link to public guidance (US Preventive
  Services Task Force; US Multi-Society Task Force on Colorectal Cancer). Citing a
  source does not validate the software.

## Pre-demo checklist (10 minutes before)

1. `GET /api/health` returns `{"status":"ok"}` (database reachable).
2. `LLM_PROVIDER` is set as planned. For a live model also set `LLM_MODEL` and a
   server-side `OPENAI_API_KEY`; keys never appear in the browser or slides.
3. Open two isolated browser sessions (A and B), using separate profiles or normal
   and private windows, on `/patient`. Two ordinary windows in the same profile
   share cookies. In each session, open **Presenter controls**, choose the case, then reopen controls and click
   **Reset demo** so both start clean. Close controls before presenting. Each session's cookie owns an isolated dataset.
4. Window A — prepare **Alex Example** to the review stage (about 2 minutes): complete
   intake (age 50; **No** to every history question; medications **None**; smoking
   **No**; activity **Yes**; previous screening **Never screened**), confirm, then
   **Analyze current profile** until **Awaiting physician review**.
5. Window B — select **Jordan Example** only. Its intake is performed live.
6. Close **Presenter controls**. Confirm the selected case, **Patient view** or
   **Physician view · Demo reviewer**, and the full **DEMONSTRATIVE — NOT CLINICALLY VALIDATED**
   banner remain visible. Explain **Intake → Analysis → Physician review → Plan**:
   recorded administrative steps, not clinical approval. The role switch is demo
   navigation only; no sign-in or authorization.

**Fallback:** if the live model is slow or fails, restart with `LLM_PROVIDER=mock`
(deterministic, no API key). A live failure is shown honestly as **Analysis not
completed** with **Retry analysis**; the system blocks, it never guesses.

**Presenter shortcuts (prepared starting points).** Instead of typing intake live, open
**Presenter controls**, then **Prepared starting points** and choose one. Loading replaces only
that window's selected case and opens its starting screen; **Reset demo** rebuilds the
same starting point in this browser. Close controls after selection; reopen them for
a case switch or reset. Covered by `tests/e2e/prepared-demo.spec.ts`. Prepared starting
points exist **only with `LLM_PROVIDER=mock`**; with a live model the panel says so
and offers no buttons. To use a shortcut during a live presentation, restart in mock
first (about 10 seconds; selected cases survive the restart) and say so.

| Button                                     | State ID               | Opens               | Use it for                                                       |
| ------------------------------------------ | ---------------------- | ------------------- | ---------------------------------------------------------------- |
| **Alex — physician review**                | `alex-review`          | `/doctor`           | Alex step 2: queue row awaiting review, decisions pending        |
| **Jordan — possible redundancy review**    | `jordan-review`        | `/doctor`           | Jordan step 4: **Possible redundant test** awaiting review       |
| **Alex — reviewed plan v1**                | `alex-plan-v1`         | `/patient/plan`     | Reassessment: plan v1 shown, **Update my information** available |
| **Alex — analysis failed, ready to retry** | `alex-analysis-failed` | `/patient/analysis` | Safety close: **Retry analysis** after a blocked analysis        |

Say that a prepared state was produced by the synthetic workflow (real intake, mock
analysis) and the demo reviewer, not a real clinician. `jordan-review` skips the
unknown-date clarification; show that step live only when time allows. `alex-plan-v1`
contains a fictional demo-reviewer approval, never clinical validation.

## 0:00 — Opening (30 seconds)

> “**Better decisions, not more tests.** Health360 helps a physician see when a
> preventive exam is due — and when a recent one may make another unnecessary. Rules
> decide the scope, a language model only explains, and a physician always decides.”

## 0:30 — Alex: screening due (1 minute, window A)

1. `/patient/analysis` shows **Awaiting physician review**, **Waiting for the demo reviewer**,
   and **Next: Demo reviewer**. Show four-stage progress: intake and analysis recorded,
   physician review current, plan waiting. **Refresh status** reads the latest status.
   Open `/patient/plan`: no preliminary actions appear; its next action is **View review status**.
   Waiting is for a person; no completion time is promised.
   > “The patient sees status only. Preliminary output is never presented as advice.”
2. Go to `/doctor` → **Start review** (**Continue review** after opening). Opening
   records administrative in-progress status only. Follow the task summary: check
   context/evidence, decide every proposal, finalize. Use **Go to proposals and evidence** and
   **Go to physician decisions** to move through the workspace. Show **Preventive opportunity**, open **View
   rationale and criteria** (`crc-screening-due · Rule v1`, data considered) and
   **View evidence and sources** (US Preventive Services Task Force).
   > “Every proposal traces to a versioned rule, the data used and a public source.”
3. In **Physician decisions**, set **Decision for proposal 1** to **Approve** and click
   **Finalize review**. Wait for **Review finalized. Reviewed demonstration plan published.**
   from the server, then **View patient plan**: **Reviewed demonstration plan**.
   Selection or a click alone never confirms publication.
   > “Only what the physician finalized becomes the patient's plan.”

## 1:30 — Jordan: the “Do Not Test” moment (3 minutes, window B)

Jordan is 60, average risk, with a normal, complete, adequately prepared colonoscopy
in 2022 — but at first does not remember the date.

1. `/patient/intake`: age **60**; **No** to every history question; medications
   **None**; smoking **No**; activity **Yes**. Previous exams: **Colonoscopy**,
   examination date **I don't know**, normal/complete/adequate preparation **Yes**.
   Check the confirmation box and click **Confirm and save profile**.
2. Click **Analyze current profile** → **More information needed**.
   > “Unknown stays unknown. The system asks instead of assuming.”
3. Click **Answer missing information**. The question “On what exact date was your
   previous screening examination?” has **I don't know** preselected. Clear it, enter
   **November 3, 2022** in the order the date field shows (`mm/dd/yyyy` on an en-US
   browser; a `dd/mm/yyyy` field needs **03/11/2022**), click **Save answers and
   analyze again** → **Awaiting physician review**.
   > “After the server saves the answer, it creates a new profile version; earlier versions are kept. Another preliminary analysis still needs fresh physician review.”
4. `/doctor` → **Start review**: **Possible redundant test**. Open the criteria:
   `crc-routine-repeat · Rule v1`, the 2022 examination data, and the limitation
   “A recent test alone does not establish redundancy.” Open the evidence (US
   Multi-Society Task Force).
   > “This is the Do Not Test insight: a repeat colonoscopy may be unnecessary within
   > ten years after a high-quality normal exam — but only a physician can confirm it.”
5. Choose **Modify**, give a reason, write plain wording such as “Discuss with your
   physician whether a repeat colonoscopy is needed now.”, then **Finalize review**.
   `/patient/plan` shows only that reviewed wording.

### Optional physician clarification branch

Selecting **Request clarification** only edits the draft. Enter the question, then use
**Send clarification request** to send it to the patient. This requires updated
information, a new analysis and fresh physician review; it does not publish a plan.
Patient answers stay patient-reported and unknown answers remain unknown. Do not
narrate draft reasons as patient guidance.

## 4:30 — Jordan: reassessment keeps history (1 minute, window B)

1. From the reviewed plan, **View update options** opens `/patient/history#update-information`
   without starting an update. Submit the existing **Update my information** form.
   Intake opens with prior answers. Confirm and save, then **Analyze current profile**.
   On My plan, show current-cycle guidance above **Previous reviewed plan**, with its
   real version. The new evaluation needs its own analysis and physician review.
   Action tracking is not available in this demonstration.
2. In `/doctor`, review and finalize the new analysis. `/patient/history` now lists
   **View plan version 1** and **View plan version 2**.
   > “New information creates a new review and plan version. Nothing is overwritten.”

## 5:30 — Safety and close (30–60 seconds)

> “If the model times out, returns malformed output or cites evidence it was not given,
> the analysis is blocked with no proposals, and the patient can retry. Synthetic data,
> demonstrative rules, mandatory physician review: better decisions, not more tests.”

The failure path is rehearsed by acceptance Flow E with six controlled test faults; do not
present a prepared failure as a live outage. **Retry analysis** shows **Analysis requested.
Waiting for the server response.** while submission is pending. Success is still preliminary
and waits for the demo reviewer. Never describe deterministic mock output as a live LLM call.

## Timed rehearsal outline

Target: **6:00 total**, hard stop at 7:00. Rehearse once on the release build
(`pnpm build && pnpm start`) with the provider you will present, and write down the
actual time per block.

| Block                               | Target | Live path                                | Shortcut if behind schedule                    |
| ----------------------------------- | ------ | ---------------------------------------- | ---------------------------------------------- |
| Opening                             | 0:30   | Spoken                                   | —                                              |
| Alex: screening due (Flow A)        | 1:00   | Pre-demo prepared intake → review → plan | `alex-review`                                  |
| Jordan: Do Not Test (Flows C and B) | 3:00   | Live intake, clarification, modify       | `jordan-review` (skip the clarification step)  |
| Jordan: reassessment (Flow D)       | 1:00   | History → update → review → plan v2      | `alex-plan-v1`, then **Update my information** |
| Safety and close (Flow E)           | 0:30   | Spoken                                   | `alex-analysis-failed` → **Retry analysis**    |

Shortcuts in the last column require `LLM_PROVIDER=mock` (see Presenter shortcuts).

Checkpoints: Jordan starts by **1:30**; reassessment starts by **4:30**. If you are more
than 30 seconds behind at a checkpoint, switch that block to its shortcut.

**If live OpenAI is slow:** successful live calls took 11–17 seconds in the recorded
live run (`docs/STATUS.md`), so each analysis click costs a pause. If one call exceeds
about 20 seconds during rehearsal, or fails, restart the server with
`LLM_PROVIDER=mock` (deterministic, no API key) and present with the mock, saying so.
Never present a mock result as a live model result. A blocked analysis during the
demo is shown honestly with **Retry analysis**.

## Recovery during the demo

- Wrong starting point: open **Presenter controls** and use **Reset demo**. It restores
  this browser's selected starting point. Close controls again before presenting.
- Temporary loading problem: **Try again** or **Refresh status** reads recorded state;
  do not reset a case just to check a loading problem.
- **Analysis not completed**: click **Retry analysis**; never bypass the block.
- Health check failing: restore the database connection; never delete volumes or
  rerun migrations against shared data.

## Appendix — rehearsal and acceptance suite

Use a disposable PostgreSQL database for both `DATABASE_URL` and `TEST_DATABASE_URL`,
`LLM_PROVIDER=mock`, `LLM_MODEL=deterministic-v1`, `LLM_LIVE_SMOKE=0` and
`DEMO_COOKIE_SECURE=false` for local HTTP. Apply migrations with `pnpm db:migrate`.

```powershell
$env:PORT = '3210'
pnpm.cmd verify
pnpm.cmd test:e2e tests/e2e/acceptance
```

Covered journeys (desktop and mobile): A first evaluation through approval and plan;
B Jordan's possible redundancy, modified and published as reviewed wording; C unknown
examination date answered with the date or with I don't know; D a second review cycle
producing plan v2 while v1 is preserved; E six provider faults with safe retry. Each
test owns an isolated synthetic dataset and removes it afterwards. A live provider
check is separate (`LLM_LIVE_SMOKE=1`, explicit authorization); neither mock nor live
runs establish clinical validity.
