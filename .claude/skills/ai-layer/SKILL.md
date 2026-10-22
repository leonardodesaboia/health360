---
name: ai-layer
description: Recipe for the Health360 server-side AI layer: the replaceable LLM provider interface, versioned prompts, minimized inputs, structured output with Zod, evidence/category validators, and fail-closed blocked or needs-review states. Use when touching src/server/ai, LLM_* env vars, prompts, model output schemas, analysis orchestration, clarification-question drafting, or any LLM/API call.
---

# Health360 AI-layer recipe

Only implement this layer when the assigned task authorizes it (OpenSpec changes `p0-06-llm-adapter` and `p0-07-analysis-validation`). The product rule: **no proprietary AI**. Use an established external LLM through an API with a configurable provider and model, plus deterministic rules and mandatory physician review. Read `docs/product/PRODUCT_CONTEXT.md` §3–4 and §9–11, and `ARCHITECTURE.md` "Future server boundaries". Apply the `clinical-safety` skill throughout.

## Layout (create only what the task needs)

```text
src/server/ai/
  provider/     # LlmProvider interface plus one adapter; selected by LLM_PROVIDER
  prompts/      # versioned prompt builders (id plus version); no patient identifiers
  schemas/      # Zod output contract(s); single source for parsing and types
  validators/   # evidence-ID, category, required-field, and version checks
  services/     # orchestration: profile -> rules -> request -> parse -> validate -> persist
```

Every module starts with `import "server-only";`. Client code never imports from `src/server`.

## Provider contract

- Use one small interface, for example `generateStructured({ promptId, promptVersion, input, schema, timeoutMs })`. It returns a discriminated result: `{ ok: true, data, meta }` or `{ ok: false, reason }`, with reasons such as `timeout`, `api_error`, `invalid_output`, and `refused`. Don't throw raw provider errors into the UI.
- Read configuration from server env: `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, `LLM_TIMEOUT_MS`. Document them in `.env.example` and `ARCHITECTURE.md`. Never hard-code a model name. Swapping providers must not change feature code or UI.
- Use the provider's native structured-output or JSON-schema mode when available, and parse with the Zod schema regardless.
- Check the provider SDK's current API with Context7 or the official docs before coding. Don't write it from memory.

## Input minimization

Send only the fields the scenario's rules need: age, relevant history, medications, habits, exams, and the missing-information list. Never send display names, IDs that could re-identify a person, or free text the analysis doesn't use. The clinical context is the medically selected, versioned scenario from `src/server/clinical-rules`. No RAG and no vector DB.

## Validation pipeline (schema-valid is not enough)

1. The deterministic rules run **before** the model. Eligibility, contraindication, and blocking results are inputs to the prompt, never outputs of the model.
2. Parse the output with Zod. On failure, return `invalid_output` and mark the analysis blocked.
3. Validators reject the output on:
   - an evidence ID not in the supplied context version;
   - a category outside the allowed set;
   - a missing required field (summary, uncertainties, missing information, questions for the physician);
   - a stale profile or context version;
   - a proposal the deterministic layer blocked.
4. Only then persist the output as a **preliminary** analysis and move the workflow to `MEDICAL_REVIEW_PENDING` (or `CLARIFICATION_REQUIRED` when the application determines that data is missing).

Every failure goes to `ANALYSIS_FAILED` or the blocked state, with bounded error metadata and safe pt-BR copy. Nothing is published automatically.

## Persistence and logging

- Store: prompt ID and version, context version, profile version, provider and model, timestamp, structured output, and validation result.
- Don't store private chain-of-thought, raw prompts containing patient data, or API keys. Redact secrets from logs.
- Retries are idempotent (keyed by profile and context version) and never duplicate analyses or publish.

## Tests (stub provider; no network in unit or CI tests)

Cover each of these with a stub `LlmProvider`:

- malformed JSON;
- schema-invalid output;
- an unknown or fabricated evidence ID;
- a disallowed category;
- missing required fields;
- a stale version;
- timeout and API error;
- a retry that doesn't duplicate.

Also assert payload minimization: no names or IDs in the request. A live API smoke check uses synthetic data, needs separate user authorization and a user-supplied key, and proves integration only, never clinical validity.
