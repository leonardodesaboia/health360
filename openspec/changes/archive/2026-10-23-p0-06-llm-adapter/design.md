## Boundaries

All production modules live under src/server/ai and import server-only. The caller supplies a synthetic, versioned profile projection and context with evidence and deterministic allowed proposals. The context interface is independent of B's clinical-rules implementation. Reuse HealthProfile fields and proposal categories from foundation contracts. Do not change those contracts.

The provider accepts versioned system instructions, minimized JSON input and an AbortSignal and returns unknown structured content or a bounded failure. OpenAI uses Responses structured output with the official SDK, store:false, no tools, no reasoning summaries and no automatic retries. Model comes only from LLM_MODEL. Configuration errors fail closed. The deterministic mock is selected only explicitly and never on an OpenAI failure.

## Safety and failure handling

Strip identifier fields through an explicit clinical projection; callers must select only necessary synthetic facts (never put identifying text in clinical fields). Keep profile/context versions in local metadata, never names or patient IDs in requests. Preserve nulls. Strict schemas reject extra output (including chain-of-thought). Evidence references must exist and not be placeholders; proposed categories/rules must be in the supplied deterministic allowed scope. No claim of clinical validity follows from these checks. P0-07 owns freshness, idempotency and persistence.

Race every provider against a 1–120000 ms deadline and abort on timeout; clear timers on all exits. Return no raw SDK errors, raw prompts or responses. Successful structured output is AI_GENERATED, demonstrative and NEEDS_REVIEW; no code publishes it.

## Verification plan

Write failing adapter-boundary tests before production code. Test each failure with deterministic providers; test actual SDK request construction via injected fetch without network. Cover model selection, server-only configuration, payload minimization, unknowns, schema errors, evidence and deterministic scope. Live smoke is separately opt-in and hard-disabled in CI; do not run it without explicit authorization/key. Run repository verification, desktop/mobile foundation e2e, formatting and strict spec validation. Apply clinical, security, TypeScript and spec-conformance checklists inline, then native AO review after PR push.
