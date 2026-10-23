import { expect, it } from "vitest";
import { patientSchema, timelineEventSchema } from "./contracts";
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

it.each([
  "PROFILE_UPDATED",
  "INTAKE_COMPLETED",
  "ANALYSIS_CREATED",
  "REVIEW_COMPLETED",
  "PLAN_PUBLISHED",
  "REVIEW_UPDATED",
  "REVIEW_CLARIFICATION_REQUESTED",
  "ANALYSIS_FAILED",
  "CLARIFICATION_REQUESTED",
  "CLARIFICATION_ANSWERED",
  "REASSESSMENT_REQUESTED",
])("accepts the versioned timeline kind %s", (kind) => {
  expect(
    timelineEventSchema.parse({
      id: "synthetic-event",
      patientId: demoPatient.id,
      occurredAt: "2026-10-23T00:00:00Z",
      kind,
      entityId: "synthetic-entity",
      entityVersion: 1,
      provenance: "SYSTEM_STRUCTURED",
    }).kind,
  ).toBe(kind);
});

it("rejects unsupported kinds and invalid timeline versions", () => {
  const event = {
    id: "synthetic-event",
    patientId: demoPatient.id,
    occurredAt: "2026-10-23T00:00:00Z",
    kind: "REVIEW_UPDATED",
    entityId: "synthetic-entity",
    entityVersion: 1,
    provenance: "PHYSICIAN_REVIEWED",
  };
  expect(
    timelineEventSchema.safeParse({ ...event, kind: "AUTOMATIC_APPROVAL" })
      .success,
  ).toBe(false);
  expect(
    timelineEventSchema.safeParse({ ...event, entityVersion: 0 }).success,
  ).toBe(false);
});
