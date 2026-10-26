## Why

P0-12 currently marks physician-origin CLARIFY requests unavailable. PR #28 now provides a typed, locked reader, so patients can answer those requests without interpreting review reasons or creating a chatbot.

## What Changes

- Read current physician requests within the patient clarification transaction.
- Show the reviewer's question with bounded known-field inputs or a separate free-text input when no field was named; every input supports I don't know.
- Preserve immutable profiles and question/answer provenance, reject stale review versions, and call the existing exported analysis service before a fresh review.

## Capabilities

### New Capabilities

- `physician-patient-clarification`: Patient answers to typed physician requests.

## Impact

Follow-up to [P0-12](../../../docs/backlog/IMPLEMENTATION.md#p0-12), based on PR #28. No edits to doctor screens, clinical-review internals, analysis internals or shared patient contracts. Rebase onto main after PR #28 merges.
