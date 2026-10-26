# Current implementation status

Snapshot: **October 26, 2026**, `origin/main` at `2264825` (PR #36 merged), checked
against source and `gh pr list --state all`. This is a dated inventory; the
[ordered index](backlog/IMPLEMENTATION.md) owns task order and pickup lifecycle.
Synthetic data only. **DEMONSTRATIVE — NOT CLINICALLY VALIDATED**.

## Backlog delivery

Implemented describes landed code, not clinical validation. P0-01 through P0-13 are
implemented and archived. P0-14 parts 1 and 2 are merged; its change stays open
until the presenter's timed rehearsal on the release build.

| Item                         | State on main                                     | PRs and remaining boundary                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-01 Persistence            | Implemented, archived                             | [#8](https://github.com/leonardodesaboia/health360/pull/8): Prisma/Postgres, dataset isolation and immutable versions                                                                                                                         |
| P0-02 Session/reset          | Implemented, archived                             | [#16](https://github.com/leonardodesaboia/health360/pull/16), [#19](https://github.com/leonardodesaboia/health360/pull/19), [#21](https://github.com/leonardodesaboia/health360/pull/21): cookie-bound selection/reset, case-scoped workspace |
| P0-03 Guided intake          | Implemented, archived                             | [#9](https://github.com/leonardodesaboia/health360/pull/9), [#18](https://github.com/leonardodesaboia/health360/pull/18): drafts, steps and persisted submission                                                                              |
| P0-04 Clinical profile       | Implemented, archived                             | [#17](https://github.com/leonardodesaboia/health360/pull/17), [#18](https://github.com/leonardodesaboia/health360/pull/18), [#31](https://github.com/leonardodesaboia/health360/pull/31): nullable typed facts, seeded intake facts           |
| P0-05 Context/rules          | Implemented in restricted demonstrative CRC scope | [#7](https://github.com/leonardodesaboia/health360/pull/7); public source metadata is not medical validation                                                                                                                                  |
| P0-06 LLM adapter            | Implemented, archived; live OpenAI run recorded   | [#10](https://github.com/leonardodesaboia/health360/pull/10), [#15](https://github.com/leonardodesaboia/health360/pull/15); see [live provider verification](#live-provider-verification)                                                     |
| P0-07 Analysis               | Implemented, archived                             | [#20](https://github.com/leonardodesaboia/health360/pull/20); claim/evaluate/validate/persist, retry and freshness guards                                                                                                                     |
| P0-08 Do Not Test            | Implemented, archived                             | [#23](https://github.com/leonardodesaboia/health360/pull/23); possible redundancy is preliminary until physician review                                                                                                                       |
| P0-09 Physician reader       | Implemented, archived                             | [#21](https://github.com/leonardodesaboia/health360/pull/21), [#34](https://github.com/leonardodesaboia/health360/pull/34): dataset-scoped queue and workspace, UX polish                                                                     |
| P0-10 Decisions/finalization | Implemented, archived                             | [#28](https://github.com/leonardodesaboia/health360/pull/28): decisions, typed CLARIFY requests, atomic finalization and publication, decision history                                                                                        |
| P0-11 Reviewed plan          | Implemented, archived                             | [#11](https://github.com/leonardodesaboia/health360/pull/11); published only from P0-10 finalization                                                                                                                                          |
| P0-12 Clarification          | Implemented, archived                             | [#24](https://github.com/leonardodesaboia/health360/pull/24), [#26](https://github.com/leonardodesaboia/health360/pull/26), [#30](https://github.com/leonardodesaboia/health360/pull/30): AI- and physician-origin bounded questions          |
| P0-13 History/reassessment   | Implemented, archived                             | [#14](https://github.com/leonardodesaboia/health360/pull/14), [#25](https://github.com/leonardodesaboia/health360/pull/25); second review cycle proven by acceptance Flow D                                                                   |
| P0-14 Demo/acceptance        | Parts 1–2 merged; change open                     | [#33](https://github.com/leonardodesaboia/health360/pull/33), [#35](https://github.com/leonardodesaboia/health360/pull/35), [#36](https://github.com/leonardodesaboia/health360/pull/36); presenter's timed rehearsal outstanding             |

Shared infrastructure: [#12 workflow API](https://github.com/leonardodesaboia/health360/pull/12),
[#13 timeline kinds](https://github.com/leonardodesaboia/health360/pull/13),
[#22 deploy readiness](https://github.com/leonardodesaboia/health360/pull/22),
[#29 security hardening](https://github.com/leonardodesaboia/health360/pull/29),
[#32 patient UX polish](https://github.com/leonardodesaboia/health360/pull/32).

## Flows A–E

All five flows run end to end through real browser controls in
`tests/e2e/acceptance/journeys.spec.ts` (desktop and mobile, deterministic mock
provider). The [18-point audit](../openspec/changes/p0-14-demo-acceptance/tasks.md)
maps each product acceptance point to its evidence.

| Flow               | Covered on main                                                                                                      | Prepared starting point (#36) |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| A First evaluation | Select case → intake → profile → analysis → queue → approve → finalize → reviewed plan; reset isolation              | `alex-review`                 |
| B Do Not Test      | Recent normal colonoscopy → traceable possible redundancy → physician modifies → only revised wording published      | `jordan-review`               |
| C Clarification    | Unknown exam date → bounded question with I don't know → profile vN+1 → reanalysis; unknown stays blocked            | —                             |
| D Reassessment     | Plan v1 → update information → second analysis and review → plan v2, v1 preserved in history                         | `alex-plan-v1`                |
| E AI failure       | Six provider faults fail closed with no proposals; retry creates one preliminary analysis that still requires review | `alex-analysis-failed`        |

## Live provider verification

Reported by worker health360-22 on October 26, 2026, at `fe63370` (before #31–#36),
with no code changes, using synthetic data and the live OpenAI model `gpt-6-astra`.
This run was not repeated by the closeout PR.

- Live smoke (`LLM_LIVE_SMOKE=1`): PASS.
- Headless Chromium UI flows: A PASS (12.7 s), B PASS (13.7 s), C missing information
  PASS (2.3 s, no API call), C resolved PASS (16.9 s), E bad model PASS (5.0 s,
  ANALYSIS_FAILED, no proposals), E retry PASS (14.7 s).
- Zod structured output, evidence IDs a subset of supplied evidence, deterministic
  rules unchanged, persisted clarification versions, immutable failed attempt and
  idempotent retry: PASS.
- Successful calls took 11.3–17.3 s, under `LLM_TIMEOUT_MS=30000`; at most 16 live
  requests were made.
- Limits: narrative quality was not clinically assessed. Passing a live run is
  engineering evidence only, never clinical validation.

## Known gaps and risks

- The presenter's timed rehearsal on the release build has not been recorded; use the
  [outline](product/DEMO_SCRIPT.md#timed-rehearsal-outline). P0-14 stays open until then.
- Production VPS deployment, DNS and TLS are unverified. The production Docker dry run
  passed locally at `bd0a87d`. The user deploys using the [runbook](deploy/easypanel.md).
  Force `LLM_PROVIDER=mock` for offline demos; Postgres is still required.
- Without a selected case, `/patient/profile` shows the browser-local demonstrator
  profile; with a case it renders the session's latest persisted profile.
- Prepared starting points (`alex-review`, `jordan-review`, `alex-plan-v1`,
  `alex-analysis-failed`) are built by the real intake, mock-analysis and demo-reviewer
  producers, never by inserting status, review or plan rows. The demo reviewer approval
  behind `alex-plan-v1` is fictional and is not clinical validation.
- Clarification resolves only supported fields. Unknown answers stay null and can
  return to CLARIFICATION_REQUIRED; they never bypass gates.
- Preserve analysis reference comparisons and version checks across its two
  transactions. Provider work belongs outside transactions. See [ADR0005](adr/0005-integration-contracts.md).
- Public demo pages, role links and cookies provide no real authentication or
  physician authorization. No real patient use is permitted.
- Agent-authored scenarios/rules, public evidence metadata, schema checks, tests
  and fictional review never establish clinical validity.
- P1 is deferred until P0-14 closes for the November 3 deadline.

## Environment and reconciliation notes

- The P0-14 closeout reconciled and archived the P0-02, P0-06 mock-findings, P0-11
  and P0-13 changes against merged code and the acceptance suite. The superseded
  demo-mode requirement for disabled decisions and an unavailable plan was removed
  from the baseline specs.
- Clarification reserves CLARIFICATION_REQUIRED → ANALYSIS_PENDING itself (actor
  patient) with profile vN+1 in one transaction, then calls
  `resumeAnalysisForSession`. `beforeClaim` remains an available analysis hook.
- Local Postgres: `.env.example` and Compose default to **5432**. When that port is
  occupied, apply README overrides to `POSTGRES_PORT` and both URLs.
- Original foundation-only/no-persistence/no-route-invokes-AI claims are obsolete.
  Historical ADR0001 describes its original phase, not today's implementation.
- The SQL trigger binds INTAKE_COMPLETED to IntakeResponse (entityVersion is
  profileVersion), not HealthProfile. DRAFT is a policy term, not a current
  MedicalReview status field.
- The orchestration log reported AO/Codex launch-flag incompatibility (CLI 0.163.0),
  possible missing activity hooks and deprecated user-level `features.rmcp_client`.
  These are machine issues, not app defects. Do not edit global configuration
  incidentally; consult the harness tooling guides.
- `.gitattributes` normalizes LF. Check formatting after Windows edits. Docker
  Desktop's Linux engine must be running.
