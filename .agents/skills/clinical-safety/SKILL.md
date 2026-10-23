---
name: clinical-safety
description: Health360 clinical-safety and AI-boundary rules. Use for any work touching clinical data, patient or physician screens, health intake, clinical profile, evidence, rules, AI analysis, proposals, physician review, preventive plans, timeline, fixtures, or demo data, and whenever text could read as medical advice or validation. Use before publishing or displaying any clinical content.
---

# Health360 clinical safety and AI boundaries

Health360 is a **pre-validation prototype on synthetic data**. Clinical decisions belong to physicians. Software checks, schema validation, tests, and fictional reviewer actions are **never** medical validation. This skill is engineering guidance, not a medical protocol.

## Read first

- `AGENTS.md`, section "Clinical boundaries" (canonical).
- `docs/product/PRODUCT_CONTEXT.md`: AI strategy and rules (§3–4), the physician workspace (§12), states (§16), and what NOT to build (§19).
- `ARCHITECTURE.md`: contracts, future server boundaries, and trust model.

## Non-negotiables

1. **Synthetic data only.** Fixtures are marked synthetic (`synthetic: true` or `demonstrative: true`). Never add real names, documents, identifiers, or real patient records, even as examples.
2. **Unknown is not negative.** Missing or "I don't know" answers stay `null` and appear in an explicit missing-information list. Never default an unknown clinical fact to `false`, "normal", or a plausible value.
3. **Demonstrative authoring; no fabricated evidence.** Agents may author synthetic patient scenarios, demonstrative rules and expected outcomes for the MVP demo. Each rule/scenario carries `validation: "demonstrative"` (or equivalent `reviewStatus`) in data and displays **DEMONSTRATIVE — NOT CLINICALLY VALIDATED** wherever shown in the UI. Cite only real, publicly verifiable sources with guideline name, issuer, year and URL. Never fabricate citations, statistics, accuracy/confidence claims, testimonials or partnerships. Without a supporting source, mark `evidence: placeholder` and display it as such; placeholders never satisfy evidence validators or bypass publication gates. In-app physician review remains mandatory; a demo reviewer is never real clinical validation. Real clinical use requires formal medical review. See `docs/adr/0003-mvp-runtime-decisions.md`.
4. **Provenance is visible.** Keep these distinct in contracts and in the UI: patient-reported, system-structured, rule-generated, AI-generated, physician-reviewed (`provenanceSchema`).
5. **The LLM decides nothing.** The model may structure, summarize, explain, and draft questions. It doesn't diagnose, authorize, expand clinical scope, or turn its output into a final recommendation. Eligibility, contraindication, and blocking checks are deterministic application code with versioned rules.
6. **Physician review gates publication.** No plan, proposal, or redundancy flag reaches the patient until a physician has decided on it (approve, modify, or reject, with a reason for modify and reject) and has explicitly finalized the review. Leaving an item pending blocks publication.
7. **Fail closed.** An API failure, timeout, invalid schema, unknown or missing evidence ID, unsupported category, contradictory input, or insufficient data produces a **blocked or needs-review** state with safe US English copy. Never fall back to a default recommendation. Retries never auto-publish and never duplicate analyses.
8. **A demo is not authorization.** The role switcher changes navigation only. Never infer authority from the URL, a client cookie, or a disabled button. Future server handlers check actor, ownership, and version freshness.
9. **Versioned and auditable.** Record clinical-context version, model identifier, profile or analysis version, reviewer (demo) identity, timestamp, decision, and reason. Never overwrite previous plan or profile versions. Never store private chain-of-thought or raw prompts with identifiers. Keep only structured outputs and audit metadata.
10. **Data minimization.** Send the model only the fields the analysis needs, never display names or identifiers. API keys are server-only (never `NEXT_PUBLIC_*`, never in client bundles or logs).

## Copy rules for clinical content

- Label AI-generated text as preliminary ("Preliminary proposal, awaiting physician review").
- Don't show unreviewed proposals to patients, or anywhere they could look approved.
- Show no risk percentages, health scores, or "accuracy" claims.
- Don't imply that every recent exam is unnecessary. Redundancy is always "possible" and explains the rule, the data considered, and the limitations.

## When you touch these areas, test the gates

Write tests that prove a gate holds, not only that the happy path works:

- unknown values stay unknown end-to-end;
- a fabricated or unknown evidence ID is rejected;
- a stale profile or context version is rejected;
- publication is impossible before finalized review;
- each failure mode above lands in the blocked or needs-review state;
- a retry does not publish or duplicate.

Never weaken a gate to make a test pass.

## Escalate, don't guess

Escalate (ask the user or orchestrator) when a task needs:

- criteria or expected outcomes intended for real clinical use (formal medical review required);
- a change to who may publish;
- any real-data or deployment decision.

State the limitation in your report.
