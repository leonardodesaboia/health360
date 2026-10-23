# ADR0004: English product language

- Status: accepted
- Date: 2026-10-22

## Context

Health360 will be demonstrated at the international HISIC 2026 competition on
November 3, 2026. A consistent language is needed across both experiences and
their supporting documentation.

## Decision

Use natural US English for all UI copy, documentation, scenario content, tests,
OpenSpec artifacts and agent guidance. Set the HTML document language to `en` and
format displayed dates and numbers with the `en-US` locale, for example
`Oct 22, 2026`. Preserve ISO values in contracts and storage.

This decision supersedes the previous Brazilian Portuguese language requirement.
Clinical safety, synthetic-data restrictions and mandatory physician review remain
in force. Translation does not confer clinical validation.

## Consequences

Existing copy and guidance are translated together. New work starts in English.
Routes, technical identifiers and entity contracts remain stable. Additional
locales are outside the current demonstration scope.
