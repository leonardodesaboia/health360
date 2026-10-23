import { describe, expect, it, vi } from "vitest";
import { evaluateScreening } from "../../server/clinical-rules/evaluate";
import { scenarioVariant } from "../../server/clinical-rules/scenarios";
import { initialAnswers } from "./contracts";
import { buildCompletedIntake } from "./profile";

vi.mock("server-only", () => ({}));

type Fact = boolean | null;
/** Aggregation semantics agreed for P0-07: any true → true; all false → false; otherwise null. */
const aggregate = (values: Fact[]): Fact =>
  values.includes(true)
    ? true
    : values.every((v) => v === false)
      ? false
      : null;

describe("completed intake → demonstrative evaluator", () => {
  it("repeat-screening intake yields READY_FOR_REVIEW with a redundancy finding", () => {
    const answers = {
      ...(Object.fromEntries(
        Object.keys(initialAnswers).map((id) => [id, null]),
      ) as typeof initialAnswers),
      age: "60",
      rectalBleeding: "no",
      bowelChange: "no",
      weightLoss: "no",
      colorectalCancer: "no",
      polyps: "no",
      ibd: "no",
      hereditaryCancerSyndrome: "no",
      serratedPolyposis: "no",
      familyCrc: "no",
      familySyndrome: "no",
      medications: "None",
      smoking: "no",
      activity: "yes",
      priorScreening: "COLONOSCOPY",
      examDatePrecision: "EXACT",
      examDate: "2022-11-03",
      colonoscopyNormal: "yes",
      colonoscopyComplete: "yes",
      colonoscopyAdequatePrep: "yes",
    };
    const completed = buildCompletedIntake(
      "synthetic-repeat-screening",
      answers,
      1,
      "submission",
      "2026-10-23T00:00:00Z",
    );
    expect(completed.examinations[0].result.value).toBe("Normal");
    const f = completed.profile.intakeFacts!;
    const base = scenarioVariant("repeat-screening");
    const result = evaluateScreening({
      synthetic: true,
      scenarioId: base.scenarioId,
      contextVersion: base.contextVersion,
      asOf: base.asOf,
      profile: completed.profile,
      examinations: completed.examinations,
      facts: {
        provenance: "PATIENT_REPORTED",
        symptoms: aggregate([f.rectalBleeding, f.bowelChange, f.weightLoss]),
        personalRiskHistory: aggregate([
          f.colorectalCancer,
          f.polyps,
          f.ibd,
          f.hereditaryCancerSyndrome,
          f.serratedPolyposis,
        ]),
        familyRiskHistory: aggregate([f.familyCrc, f.familySyndrome]),
        priorScreening: f.priorScreening,
        normal: f.colonoscopyNormal,
        complete: f.colonoscopyComplete,
        adequatePreparation: f.colonoscopyAdequatePrep,
      },
    });
    expect(result.status).toBe("READY_FOR_REVIEW");
    expect(result.findings.map((finding) => finding.category)).toContain(
      "POSSIBLE_REDUNDANCY",
    );
  });
});
