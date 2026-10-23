import { describe, expect, it } from "vitest";
import { seedRecords, validateRecord } from "./records";

describe("persistence input contracts", () => {
  it("validates an English demonstrative seed and preserves unknown facts", () => {
    const before = JSON.stringify(seedRecords);
    for (const [kind, records] of Object.entries(seedRecords)) {
      for (const record of records)
        expect(validateRecord(kind, record)).toEqual(record);
    }
    expect(seedRecords.profile[0].age).toBeNull();
    expect(seedRecords.examination[0].result.value).toBeNull();
    expect(JSON.stringify(seedRecords)).toBe(before);
  });

  it("rejects real-data patients, invalid versions and unsupported kinds", () => {
    expect(() =>
      validateRecord("patient", {
        ...seedRecords.patient[0],
        synthetic: false,
      }),
    ).toThrow();
    expect(() =>
      validateRecord("profile", { ...seedRecords.profile[0], version: 0 }),
    ).toThrow();
    expect(() => validateRecord("secret", {})).toThrow(
      "Unsupported record kind",
    );
  });

  it("rejects proposals attached to a different analysis", () => {
    expect(() =>
      validateRecord("analysis", {
        ...seedRecords.analysis[0],
        proposals: [
          {
            id: "proposal",
            analysisId: "other",
            category: "CLARIFICATION",
            title: "Unknown",
            rationale: "Needs review",
            ruleIds: [],
            evidenceIds: [],
            consideredData: [],
            uncertainties: [],
            provenance: "AI_GENERATED",
          },
        ],
      }),
    ).toThrow("Proposal analysis mismatch");
  });
});
