---
name: ai-layer
description: Guide future server-only LLM integration, structured outputs, evidence validation and fail-closed analysis handling.
---

This is a future recipe. Do not implement a provider unless the assigned task authorizes it.
Read product context sections 3–4 and backlog P0-05 through P0-07.
Use a replaceable server-only provider interface. Read provider/model/key from server environment; never NEXT_PUBLIC variables. Minimize synthetic inputs; do not send identifying fields.
Version prompts, context and profile. Keep deterministic eligibility, contraindication and publication gates outside the model. Medical owners approve demonstrative rules before clinical use.
Require structured output matching the Zod contracts. Validate supplied evidence IDs against the selected context, allowed categories, required fields and uncertainty. Schema parsing alone is insufficient.
On timeout/API failure/invalid output/unknown evidence, record a safe blocked state and bounded error metadata. Retry must not duplicate analyses or publish anything.
Never persist private chain-of-thought. Log version metadata and structured results only; redact secrets.
Use stub-provider unit/integration tests for malformed JSON, missing data, unknown references, unsupported categories, stale versions and timeout. A separately authorized synthetic live API check verifies integration, never clinical validity.
