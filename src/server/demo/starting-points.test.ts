import { describe, expect, it } from "vitest";
import { buildCompletedIntake } from "../../features/health-intake/profile";
import { mapIntakeFacts } from "../analysis/facts";
import { demoScenarios } from "../clinical-rules/scenarios";
import { preparedIntakeAnswers } from "./prepared-answers";
import {
  demoSelectionIdSchema,
  preparedDemoStates,
  resolveDemoSelection,
} from "./starting-points";

describe("prepared starting point contracts", () => {
  it.each(preparedDemoStates)(
    "allowlists demonstrative $id without expanding clinical scenarios",
    (state) => {
      expect(resolveDemoSelection(state.id)).toMatchObject({
        caseId: state.caseId,
        preparedStateId: state.id,
        destination: state.destination,
      });
      expect(state.synthetic).toBe(true);
      expect(state.validation).toBe("demonstrative");
    },
  );

  it.each(demoScenarios)(
    "authors complete fictional answers for $id",
    (scenario) => {
      const answers = preparedIntakeAnswers(scenario.id);
      const completed = buildCompletedIntake(
        scenario.input.profile.patientId,
        answers,
        2,
        "synthetic-presentation",
        "2026-10-26T12:00:00Z",
      );
      expect(completed.synthetic).toBe(true);
      expect(completed.validation).toBe("demonstrative");
      expect(completed.profile.missingInformation).toEqual([]);
      expect(mapIntakeFacts(completed.profile.intakeFacts)).toEqual(
        scenario.input.facts,
      );
      expect(answers.medications).toBe("None");
      expect(answers.smoking).toBe("no");
      expect(answers.activity).toBe("yes");
      expect(completed.examinations.map((exam) => exam.performedAt)).toEqual(
        scenario.input.examinations.map((exam) => exam.performedAt),
      );
      if (scenario.id === "first-screening") {
        expect(answers.colonoscopyNormal).toBeNull();
        expect(answers.examDate).toBeNull();
      }
      answers.rectalBleeding = null;
      expect(preparedIntakeAnswers(scenario.id).rectalBleeding).toBe("no");
    },
  );

  it("preserves baseline selections and rejects unknown routes and states", () => {
    expect(resolveDemoSelection("first-screening")).toEqual({
      caseId: "first-screening",
      preparedStateId: undefined,
      destination: null,
    });
    for (const id of ["/doctor", "alex-reviewed-real", "", null])
      expect(demoSelectionIdSchema.safeParse(id).success).toBe(false);
  });
});
