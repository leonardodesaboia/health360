# P0-06 — Replaceable server LLM adapter

Status: planned; **no implementation completed**.

## Why

Introduce a provider interface and one external API adapter using configurable provider/model.

## What Changes

server-only secret and minimized synthetic payload; versioned prompt/context/profile metadata; structured output; bounded timeout; no chain-of-thought retained; provider substitution does not change feature UI.

## Capabilities

### New Capabilities

- `llm-adapter`: Replaceable server LLM adapter.

### Modified Capabilities

None. This is a planned addition to the current foundation.

## Impact

future `src/server/ai` provider/prompts/schema, `.env.example`, tooling/architecture docs.

## Dependencies

P0-05; user-selected provider and separately supplied secret.

## Out of scope

Unrelated MVP modules, real-patient use, autonomous clinical decisions and product section 19 exclusions. This proposal does not authorize execution until assigned.
