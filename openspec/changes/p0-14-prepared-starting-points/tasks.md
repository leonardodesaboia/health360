## Build and regression coverage

- [ ] Add failing DB tests for all four prepared states and their real screen-reader models.
- [ ] Implement explicit scenario answers and producer-built prepared states with safe session activation/reset.
- [ ] Add prepared selector options and existing-screen navigation without patient/physician UI edits.
- [ ] Cover failure/retry, mock-only guard, isolated reset, producer failure and baseline compatibility.
- [ ] Verify actual desktop/mobile screens and keyboard operation through selector tests outside acceptance.

## Verification and completion

- [ ] Run focused units and full DB integration tests.
- [ ] Run pnpm verify, pnpm test:e2e, pnpm format:check and strict OpenSpec validation.
- [ ] Review scope, TypeScript, design and clinical/workflow boundaries inline; record verification evidence.

After verification and review, archive through the locked OpenSpec CLI. Publication follows archive: publish the scoped PR, request native AO review and obtain green CI; leave merging to the user.
