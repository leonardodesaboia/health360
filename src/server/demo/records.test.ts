import { describe, expect, it } from "vitest";
import { demoScenarios } from "../clinical-rules/scenarios";
import { validateRecord } from "../db/records";
import { demoCaseIdSchema, demoSessionTokenSchema } from "./contracts";
import { demoCaseRecords, demoDatasetId, newDemoSessionToken } from "./records";

describe("demo session records", () => {
  it("maps each prepared case to valid not-started storage records only", () => {
    const before = JSON.stringify(demoScenarios);
    for (const caseId of demoCaseIdSchema.options) {
      const records = demoCaseRecords(caseId);
      expect(Object.keys(records).sort()).toEqual([
        "examination",
        "patient",
        "profile",
      ]);
      expect(records.patient).toEqual(validateRecord("patient", records.patient));
      expect(records.patient.status).toBe("NOT_STARTED");
      expect(records.patient.synthetic).toBe(true);
      expect(records.profile.patientId).toBe(records.patient.id);
      expect(records.profile.examinationIds).toEqual(
        records.examination.map((exam) => exam.id),
      );
    }
    expect(JSON.stringify(demoScenarios)).toBe(before);
  });

  it("preserves unknown values from the scenario instead of defaulting them", () => {
    const { profile } = demoCaseRecords("first-screening");
    expect(profile.medications).toEqual([
      { value: null, provenance: "PATIENT_REPORTED" },
    ]);
    expect(demoCaseRecords("first-screening").examination).toEqual([]);
    expect(demoCaseRecords("repeat-screening").examination[0].performedAt).toBe(
      "2022-11-03",
    );
  });

  it("returns fresh copies so callers cannot mutate prepared cases", () => {
    const first = demoCaseRecords("repeat-screening");
    first.profile.medications.length = 0;
    expect(demoCaseRecords("repeat-screening").profile.medications).toHaveLength(
      1,
    );
  });

  it("rejects unknown case IDs and malformed tokens", () => {
    expect(demoCaseIdSchema.safeParse("storage-only").success).toBe(false);
    expect(demoCaseIdSchema.safeParse("").success).toBe(false);
    expect(() => demoCaseRecords("other" as never)).toThrow();
    expect(demoSessionTokenSchema.safeParse("short").success).toBe(false);
    expect(demoSessionTokenSchema.safeParse(`${"a".repeat(42)}=`).success).toBe(
      false,
    );
  });

  it("derives a stable opaque dataset ID per token", () => {
    const token = newDemoSessionToken();
    const other = newDemoSessionToken();
    expect(demoSessionTokenSchema.parse(token)).toBe(token);
    expect(demoDatasetId(token)).toBe(demoDatasetId(token));
    expect(demoDatasetId(token)).toMatch(/^demo-[0-9a-f]{32}$/);
    expect(demoDatasetId(token)).not.toContain(token);
    expect(demoDatasetId(token)).not.toBe(demoDatasetId(other));
    expect(() => demoDatasetId("bad token")).toThrow();
  });
});
