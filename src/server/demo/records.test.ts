import { describe, expect, it } from "vitest";
import { demoScenarios, scenarioVariant } from "../clinical-rules/scenarios";
import { intakeFactsSchema } from "../../features/patients/contracts";
import { mapIntakeFacts } from "../analysis/facts";
import { evaluateScreening } from "../clinical-rules/evaluate";
import { validateRecord } from "../db/records";
import { demoCaseIdSchema, demoSessionTokenSchema } from "./contracts";
import { demoCaseRecords, demoDatasetId, newDemoSessionToken } from "./records";

describe("demo session records", () => {
  it.each(demoScenarios)("seeds complete typed facts for $id", (scenario) => {
    const records = demoCaseRecords(scenario.id);
    const facts = intakeFactsSchema.parse(records.profile.intakeFacts);
    expect(mapIntakeFacts(facts)).toEqual(scenario.input.facts);
    const family = scenario.id === "family-history-screening";
    const repeat = scenario.id === "repeat-screening";
    expect(facts).toEqual({
      provenance: "PATIENT_REPORTED",
      rectalBleeding: false,
      bowelChange: false,
      weightLoss: false,
      colorectalCancer: false,
      polyps: false,
      ibd: false,
      hereditaryCancerSyndrome: false,
      serratedPolyposis: false,
      familyCrc: family,
      ...(family
        ? { familyCrcFirstDegree: true, familyCrcDiagnosisAge: 50 }
        : {}),
      familySyndrome: false,
      priorScreening: repeat ? "COLONOSCOPY" : "NEVER_SCREENED",
      colonoscopyNormal: repeat ? true : null,
      colonoscopyComplete: repeat ? true : null,
      colonoscopyAdequatePrep: repeat ? true : null,
    });
    const result = evaluateScreening({
      ...scenario.input,
      profile: records.profile,
      examinations: records.examination,
      facts: mapIntakeFacts(facts),
    });
    expect(result.status).toBe("READY_FOR_REVIEW");
    expect(result.findings.map((finding) => finding.category)).toEqual([
      scenario.expectedCategory,
    ]);
    expect(result.mayPublish).toBe(false);
    expect(result.label).toBe("DEMONSTRATIVE — NOT CLINICALLY VALIDATED");
  });

  it.each([
    ["unknown-date", "NEEDS_CLARIFICATION"],
    ["new-symptoms", "OUT_OF_SCOPE"],
  ])("preserves the typed %s variant", (variant, status) => {
    const input = scenarioVariant("repeat-screening", variant);
    expect(mapIntakeFacts(input.profile.intakeFacts)).toEqual(input.facts);
    const result = evaluateScreening({
      ...input,
      facts: mapIntakeFacts(input.profile.intakeFacts),
    });
    expect(result.status).toBe(status);
    expect(result.findings).toEqual([]);
    if (variant === "unknown-date")
      expect(input.examinations[0].performedAt).toBeNull();
  });

  it("maps each prepared case to valid not-started storage records only", () => {
    const before = JSON.stringify(demoScenarios);
    for (const caseId of demoCaseIdSchema.options) {
      const records = demoCaseRecords(caseId);
      expect(Object.keys(records).sort()).toEqual([
        "examination",
        "patient",
        "profile",
      ]);
      expect(records.patient).toEqual(
        validateRecord("patient", records.patient),
      );
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
    expect(
      demoCaseRecords("repeat-screening").profile.medications,
    ).toHaveLength(1);
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
