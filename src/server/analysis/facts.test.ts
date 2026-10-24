import { describe, expect, it } from "vitest";
import { mapIntakeFacts } from "./facts";

const complete = {
  provenance: "PATIENT_REPORTED",
  rectalBleeding: false,
  bowelChange: false,
  weightLoss: false,
  colorectalCancer: false,
  polyps: false,
  ibd: false,
  hereditaryCancerSyndrome: false,
  serratedPolyposis: false,
  familyCrc: false,
  familySyndrome: false,
  priorScreening: "COLONOSCOPY",
  colonoscopyNormal: true,
  colonoscopyComplete: true,
  colonoscopyAdequatePrep: true,
};
describe("typed intake to evaluator facts", () => {
  it("maps complete negatives and colonoscopy quality one to one", () => {
    expect(mapIntakeFacts(complete)).toEqual({
      provenance: "PATIENT_REPORTED",
      symptoms: false,
      personalRiskHistory: false,
      familyRiskHistory: false,
      priorScreening: "COLONOSCOPY",
      normal: true,
      complete: true,
      adequatePreparation: true,
    });
  });
  it.each([
    ["rectalBleeding", "symptoms"],
    ["bowelChange", "symptoms"],
    ["weightLoss", "symptoms"],
    ["colorectalCancer", "personalRiskHistory"],
    ["polyps", "personalRiskHistory"],
    ["ibd", "personalRiskHistory"],
    ["hereditaryCancerSyndrome", "personalRiskHistory"],
    ["serratedPolyposis", "personalRiskHistory"],
    ["familyCrc", "familyRiskHistory"],
    ["familySyndrome", "familyRiskHistory"],
  ])("maps %s using tri-state OR into %s", (field, target) => {
    expect(mapIntakeFacts({ ...complete, [field]: true })).toHaveProperty(
      target,
      true,
    );
    expect(mapIntakeFacts({ ...complete, [field]: null })).toHaveProperty(
      target,
      null,
    );
  });
  it.each([
    ["colonoscopyNormal", "normal"],
    ["colonoscopyComplete", "complete"],
    ["colonoscopyAdequatePrep", "adequatePreparation"],
  ])("preserves false and unknown %s", (field, target) => {
    expect(mapIntakeFacts({ ...complete, [field]: false })).toHaveProperty(
      target,
      false,
    );
    expect(mapIntakeFacts({ ...complete, [field]: null })).toHaveProperty(
      target,
      null,
    );
  });
  it("does not infer missing facts or coerce strings to booleans", () => {
    const facts = mapIntakeFacts(undefined);
    expect(facts.symptoms).toBeNull();
    expect(facts.personalRiskHistory).toBeNull();
    expect(facts.priorScreening).toBeNull();
    expect(
      mapIntakeFacts({ ...complete, rectalBleeding: "false" }).symptoms,
    ).toBeNull();
  });
});
