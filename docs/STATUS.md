# Current implementation status

Snapshot: **October 25, 2026**, `origin/main` at `815ca41`, checked against source
and `gh pr list --state all`. This is a dated inventory; the
[ordered index](backlog/IMPLEMENTATION.md) owns task order and pickup lifecycle.
Synthetic data only. **DEMONSTRATIVE — NOT CLINICALLY VALIDATED**.

## Backlog delivery

Implemented describes landed code, not a complete MVP or an archived change.
Some merged slices retain active OpenSpec checklists. P0-10 remains in progress
outside main with no provider PR listed at this snapshot. P0-14 part 1 is in
progress; its change and suite are not on main.

| Item                         | State on main                                                 | PRs and remaining boundary                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-01 Persistence            | Implemented                                                   | [#8](https://github.com/leonardodesaboia/health360/pull/8): Prisma/Postgres, dataset isolation and immutable versions                                                                        |
| P0-02 Session/reset          | Implemented slices; OpenSpec lifecycle in progress            | [#16](https://github.com/leonardodesaboia/health360/pull/16), [#19](https://github.com/leonardodesaboia/health360/pull/19): cookie-bound selection/reset and canonical clinical context      |
| P0-03 Guided intake          | Implemented                                                   | [#9](https://github.com/leonardodesaboia/health360/pull/9), [#18](https://github.com/leonardodesaboia/health360/pull/18): drafts, steps and persisted submission                             |
| P0-04 Clinical profile       | Implemented                                                   | [#17](https://github.com/leonardodesaboia/health360/pull/17), [#18](https://github.com/leonardodesaboia/health360/pull/18): nullable typed facts and immutable profile                       |
| P0-05 Context/rules          | Implemented in restricted demonstrative CRC scope             | [#7](https://github.com/leonardodesaboia/health360/pull/7); public source metadata is not medical validation                                                                                 |
| P0-06 LLM adapter            | Implemented with deterministic mock verification              | [#10](https://github.com/leonardodesaboia/health360/pull/10), [#15](https://github.com/leonardodesaboia/health360/pull/15); live OpenAI check outstanding                                    |
| P0-07 Analysis               | Implemented                                                   | [#20](https://github.com/leonardodesaboia/health360/pull/20); claim/evaluate/validate/persist, retry and freshness guards                                                                    |
| P0-08 Do Not Test            | Implemented through preliminary proposal                      | [#23](https://github.com/leonardodesaboia/health360/pull/23); publication needs P0-10                                                                                                        |
| P0-09 Physician reader       | Reader implemented; review integration in progress            | [#21](https://github.com/leonardodesaboia/health360/pull/21) now merged; decision/finalization producer missing                                                                              |
| P0-10 Decisions/finalization | In progress; not implemented on main                          | No listed PR; saves, CLARIFY, finalization and decision history outstanding                                                                                                                  |
| P0-11 Reviewed plan          | Guarded publisher/reader implemented; integration in progress | [#11](https://github.com/leonardodesaboia/health360/pull/11); P0-10 must call publication atomically                                                                                         |
| P0-12 Clarification          | Patient loop implemented; physician-origin requests pending   | [#24](https://github.com/leonardodesaboia/health360/pull/24), [#26](https://github.com/leonardodesaboia/health360/pull/26): bounded questions, profile vN+1, reanalysis; CLARIFY needs P0-10 |
| P0-13 History/reassessment   | History/restart implemented; full second cycle in progress    | [#14](https://github.com/leonardodesaboia/health360/pull/14), [#25](https://github.com/leonardodesaboia/health360/pull/25) now merged; second finalized plan needs remaining producers       |
| P0-14 Demo/acceptance        | Part 1 in progress; not on main                               | Complete A–E suite, presenter script and rehearsal outstanding                                                                                                                               |

Shared infrastructure: [#12 workflow API](https://github.com/leonardodesaboia/health360/pull/12),
[#13 timeline kinds](https://github.com/leonardodesaboia/health360/pull/13),
[#22 deploy readiness](https://github.com/leonardodesaboia/health360/pull/22).

## Flows A–E

| Flow               | Connected stages on main                                                                                                   | Missing for complete acceptance                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| A First evaluation | Select case → intake → stored profile → analysis → physician reader                                                        | Decisions/finalization → first published plan from fresh case; complete acceptance run              |
| B Do Not Test      | Prior exam → deterministic check → traceable preliminary possible redundancy → reader                                      | Physician decision and reviewed patient outcome; recent alone never means unnecessary               |
| C Clarification    | Required gap → `/patient/clarification` bounded questions with I don't know → profile vN+1 → reanalysis                    | Physician CLARIFY producer/typed reader (P0-10); review and plan after reanalysis                   |
| D Reassessment     | Existing reviewed-plan guard, history/version links, request → prefilled intake → new profile/analysis; old plan preserved | Fresh case cannot create first reviewed plan; second finalized review/plan and two-cycle acceptance |
| E AI failure       | Invalid/unsupported/provider-failed result → ANALYSIS_FAILED without proposals; retry and stale-attempt guards             | Complete prepared failure/retry rehearsal and separately controlled live-provider verification      |

Focused unit, database and browser tests exist for landed slices; recorded evidence
is in the associated OpenSpec task artifacts. Fixture-seeded plan tests do not prove
a user can finalize a review. No full A–E suite is claimed.

## Known gaps and risks

- `/patient/profile` still reads the browser-local demonstrator under its local
  patient key; it is not a reader for the selected session's persisted profile.
  The physician reader uses the analyzed persisted profile.
- P0-10 blocks fresh patient-to-plan journeys. The publisher exists but has no
  production finalization caller on main. The physician workspace reads.
- Case selection seeds the legacy profile/exam snapshot without typed intakeFacts.
  Intake prefill does not reconstruct every exam/date answer. Complete the synthetic
  facts explicitly before analysis; narrative negative history is not a substitute.
- Clarification resolves only analysis-selected supported fields. Physician-origin
  CLARIFY requests remain unavailable until P0-10 exposes a typed reader. Unknown
  answers stay null and can return to CLARIFICATION_REQUIRED; they never bypass gates.
- Preserve analysis reference comparisons and version checks across its two
  transactions. Provider work belongs outside transactions. See [ADR0005](adr/0005-integration-contracts.md).
- Public demo pages, role links and cookies provide no real authentication or
  physician authorization. No real patient use is permitted.
- Agent-authored scenarios/rules, public evidence metadata, schema checks, tests
  and fictional review never establish clinical validity.
- Live OpenAI, actual VPS deployment, DNS/TLS and operator rehearsal remain
  unverified. The user deploys using the [runbook](deploy/easypanel.md).
  Force mock for offline demos; Postgres is still required.
- P1 is deferred until P0 is complete for the November 3 deadline.

## Environment and reconciliation notes

- The orchestration log/task snapshot listed #21, #24, #25 and P0-12 as open or in
  progress. GitHub and origin/main now show #21, #24, #25 and #26 (P0-12) merged.
  Dependent review and complete reassessment flows remain in progress, as above.
- The log describes clarification appending the profile through `beforeClaim`. The
  merged service instead reserves CLARIFICATION_REQUIRED → ANALYSIS_PENDING itself
  (actor patient) with profile vN+1 in one transaction, then calls
  `resumeAnalysisForSession`. `beforeClaim` remains an available analysis hook.
- Agreed local Postgres port: **5447**, because 5432 is occupied. `.env.example`
  and Compose still default to **5432**. Apply README overrides to `POSTGRES_PORT`
  and both URLs; these docs do not change runtime defaults.
- Original foundation-only/no-persistence/no-route-invokes-AI claims are obsolete.
  Historical ADR0001 describes its original phase, not today's implementation.
- Unlike the log's loose grouping of intake/profile events, the SQL trigger binds
  INTAKE_COMPLETED to IntakeResponse (entityVersion is profileVersion), not HealthProfile.
  CLARIFY is already in the core enum, while its producer is missing; DRAFT is a
  policy term, not a current MedicalReview status field.
- Active P0-02/P0-11/P0-13 folders and stale checklist wording neither negate landed
  code nor prove complete integration. Do not archive another owner's unfinished work.
- The log reports AO/Codex launch-flag incompatibility (CLI 0.163.0), possible missing
  activity hooks and deprecated user-level `features.rmcp_client`. These are reported
  machine issues, not reproduced app defects. Do not edit global configuration
  incidentally; consult the harness tooling guides.
- `.gitattributes` normalizes LF. Check formatting after Windows edits. Docker
  Desktop's Linux engine must be running.
