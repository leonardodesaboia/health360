import { expect, it } from "vitest";
import { patientSchema } from "./contracts";
import { demoPatient, demoProfile, demoExamination } from "./fixtures";

it("rejects real-data flags and invalid workflow statuses", () => {
  expect(
    patientSchema.safeParse({ ...demoPatient, synthetic: false }).success,
  ).toBe(false);
  expect(
    patientSchema.safeParse({ ...demoPatient, status: "APPROVED_BY_AI" })
      .success,
  ).toBe(false);
});
it("preserves unknown information rather than treating it as a negative finding", () => {
  expect(demoProfile.familyHistory[0].value).toBeNull();
  expect(demoExamination.performedAt).toBeNull();
  expect(demoExamination.result.value).toBeNull();
});
