import { describe, expect, it } from "vitest";
import { evaluateScreening } from "./evaluate";
import { evidenceSupportsRule, loadClinicalContext } from "./context";
import { scenarioVariant } from "./scenarios";
import { mapIntakeFacts } from "../analysis/facts";
import { demoCaseRecords } from "../demo/records";
import { preparedIntakeAnswers } from "../demo/prepared-answers";
import { buildCompletedIntake } from "../../features/health-intake/profile";
import {
  applyAnswers,
  selectQuestions,
} from "../../features/clarification/questions";

function daniel() {
  return scenarioVariant("family-history-screening");
}

describe("demonstrative family-history screening", () => {
  it("makes Daniel eligible by the family rule and verified source only", () => {
    const input = daniel();
    expect(input.profile.age).toBe(40);
    expect(evaluateScreening(input)).toMatchObject({
      status: "READY_FOR_REVIEW",
      mayPublish: false,
      requiresPhysicianReview: true,
      findings: [
        {
          ruleId: "crc-family-history-early-start",
          category: "PREVENTIVE_OPPORTUNITY",
          evidenceIds: ["usmstf-crc-family-history-2017"],
        },
      ],
    });
    const context = loadClinicalContext(input.scenarioId, 1);
    expect(context.id).not.toBe("crc-screening-demo");
    expect(context.rules).toHaveLength(1);
    expect(context.rules[0]).toMatchObject({ minAge: 40, intervalYears: 5 });
    expect(context.evidence[0]).toMatchObject({
      year: 2017,
      evidenceStatus: "public_source",
      accessedAt: "2026-10-29",
      medicallyReviewed: false,
    });
    expect(evidenceSupportsRule(context, context.rules[0])).toBe(true);
    context.evidence[0].evidenceStatus = "placeholder";
    expect(evidenceSupportsRule(context, context.rules[0])).toBe(false);
  });

  it("does not make the same 40-year-old eligible without the father's history", () => {
    const input = daniel();
    input.facts.familyRiskHistory = false;
    input.facts.familyCrc = false;
    input.facts.familyCrcFirstDegree = null;
    input.facts.familyCrcDiagnosisAge = null;
    expect(evaluateScreening(input)).toMatchObject({
      status: "OUT_OF_SCOPE",
      findings: [],
    });
    const average = scenarioVariant("first-screening");
    average.profile.age = 40;
    expect(evaluateScreening(average).status).toBe("OUT_OF_SCOPE");
  });

  it.each([
    ["familyCrcFirstDegree", false, "OUT_OF_SCOPE"],
    ["familyCrcFirstDegree", null, "NEEDS_CLARIFICATION"],
    ["familyCrcDiagnosisAge", null, "NEEDS_CLARIFICATION"],
    ["familyCrcDiagnosisAge", 60, "OUT_OF_SCOPE"],
    ["familySyndrome", true, "OUT_OF_SCOPE"],
    ["familySyndrome", null, "NEEDS_CLARIFICATION"],
    ["symptoms", true, "OUT_OF_SCOPE"],
    ["personalRiskHistory", true, "OUT_OF_SCOPE"],
  ] as const)("handles %s = %s", (field, value, status) => {
    const input = daniel();
    Object.assign(input.facts, { [field]: value });
    const result = evaluateScreening(input);
    expect(result).toMatchObject({ status, findings: [], mayPublish: false });
    if (value === null)
      expect(result.missingFields).toContain(`facts.${field}`);
  });

  it.each([
    [39, 50, "OUT_OF_SCOPE"],
    [40, 50, "READY_FOR_REVIEW"],
    [34, 45, "OUT_OF_SCOPE"],
    [35, 45, "READY_FOR_REVIEW"],
    [40, 59, "READY_FOR_REVIEW"],
    [76, 50, "OUT_OF_SCOPE"],
  ] as const)(
    "uses source start age for age %s and diagnosis %s",
    (age, diagnosis, status) => {
      const input = daniel();
      input.profile.age = age;
      input.facts.familyCrcDiagnosisAge = diagnosis;
      expect(evaluateScreening(input).status).toBe(status);
    },
  );

  it("does not apply the family rule to prior screening or unresolved information", () => {
    const input = daniel();
    input.facts.priorScreening = "COLONOSCOPY";
    expect(evaluateScreening(input).status).toBe("OUT_OF_SCOPE");
    input.facts.priorScreening = "NEVER_SCREENED";
    input.profile.missingInformation = ["Unresolved family history"];
    expect(evaluateScreening(input).status).toBe("NEEDS_CLARIFICATION");
  });

  it("round trips typed Daniel intake into seed, profile and deterministic evaluation", () => {
    const records = demoCaseRecords("family-history-screening");
    expect(records.patient.displayName).toBe("Daniel Example");
    const completed = buildCompletedIntake(
      records.patient.id,
      preparedIntakeAnswers("family-history-screening"),
      2,
      "daniel-test",
      "2026-10-29T12:00:00Z",
    );
    expect(completed.profile.intakeFacts).toMatchObject({
      familyCrc: true,
      familyCrcFirstDegree: true,
      familyCrcDiagnosisAge: 50,
      familySyndrome: false,
    });
    expect(
      completed.profile.familyHistory.map((item) => item.value).join(" "),
    ).toContain("50");
    expect(completed.profile.missingInformation).toEqual([]);
    expect(mapIntakeFacts(completed.profile.intakeFacts)).toEqual(
      daniel().facts,
    );
    expect(
      evaluateScreening({
        ...daniel(),
        profile: completed.profile,
        facts: mapIntakeFacts(completed.profile.intakeFacts),
      }).status,
    ).toBe("READY_FOR_REVIEW");
  });

  it("clarifies unknown degree and diagnosis age with bounded nullable answers", () => {
    const answers = preparedIntakeAnswers("family-history-screening");
    answers.familyCrcFirstDegree = null;
    answers.familyCrcDiagnosisAge = null;
    const missing = [
      "facts.familyCrcFirstDegree",
      "facts.familyCrcDiagnosisAge",
    ];
    const { questions, unsupported } = selectQuestions(missing, answers);
    expect(unsupported).toEqual([]);
    expect(questions.map((q) => q.id)).toEqual([
      "familyCrcFirstDegree",
      "familyCrcDiagnosisAge",
    ]);
    const unknown = applyAnswers(answers, missing, {
      familyCrcFirstDegree: null,
      familyCrcDiagnosisAge: null,
    });
    const completed = buildCompletedIntake(
      "daniel",
      unknown,
      2,
      "unknown",
      "2026-10-29T12:00:00Z",
    );
    expect(completed.profile.intakeFacts?.familyCrcFirstDegree).toBeNull();
    expect(completed.profile.intakeFacts?.familyCrcDiagnosisAge).toBeNull();
    expect(
      evaluateScreening({
        ...daniel(),
        profile: completed.profile,
        facts: mapIntakeFacts(completed.profile.intakeFacts),
      }).status,
    ).toBe("NEEDS_CLARIFICATION");
    expect(() =>
      applyAnswers(answers, missing, {
        familyCrcFirstDegree: "yes",
        familyCrcDiagnosisAge: "121",
      }),
    ).toThrow();
  });

  it("preserves Alex and Jordan's existing rule and evidence sets", () => {
    expect(
      evaluateScreening(scenarioVariant("first-screening")).findings[0],
    ).toMatchObject({
      ruleId: "crc-screening-due",
      evidenceIds: ["uspstf-crc-2021"],
      category: "PREVENTIVE_OPPORTUNITY",
    });
    expect(
      evaluateScreening(scenarioVariant("repeat-screening")).findings[0],
    ).toMatchObject({
      ruleId: "crc-routine-repeat",
      evidenceIds: ["usmstf-colonoscopy-2020"],
      category: "POSSIBLE_REDUNDANCY",
    });
  });
});
