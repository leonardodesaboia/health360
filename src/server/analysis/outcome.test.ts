import { describe, expect, it, vi } from "vitest";
import { scenarioVariant } from "../clinical-rules/scenarios";
import { loadClinicalContext } from "../clinical-rules/context";
import { prepareAnalysis } from "./prepare";
import { describeAnalysisOutcome } from "./outcome";

const identity = {
  id: "saved-analysis",
  version: 2,
  createdAt: "2026-11-03T12:00:00Z",
  provider: "mock",
  model: "deterministic-v1",
  promptVersion: 1,
};
describe("legacy out-of-scope presentation", () => {
  it.each([
    ["age", "reported age"],
    ["family", "reported family history"],
    ["prior", "never-screened"],
  ])(
    "replays the saved family-history %s exclusion without calling a provider",
    async (variant, expected) => {
      const input = scenarioVariant("family-history-screening");
      if (variant === "age") input.profile.age = 30;
      if (variant === "family") {
        input.facts.familyCrcFirstDegree = false;
        input.profile.intakeFacts!.familyCrcFirstDegree = false;
      }
      if (variant === "prior") {
        input.facts.priorScreening = "COLONOSCOPY";
        input.profile.intakeFacts!.priorScreening = "COLONOSCOPY";
      }
      const explain = vi.fn();
      const { analysis } = await prepareAnalysis(input, identity, explain);
      analysis.summary = "Legacy generic retry summary";
      const before = structuredClone({ analysis, input });
      const outcome = describeAnalysisOutcome(
        analysis,
        input.profile,
        input.examinations,
        loadClinicalContext(input.scenarioId, input.contextVersion),
      );
      expect(outcome?.explanation).toContain(expected);
      expect(outcome?.explanation).not.toContain("retry");
      expect(explain).not.toHaveBeenCalled();
      expect({ analysis, input }).toEqual(before);
      const newerProfile = {
        ...input.profile,
        version: input.profile.version + 1,
        age: 60,
      };
      expect(
        describeAnalysisOutcome(
          analysis,
          newerProfile,
          input.examinations,
          loadClinicalContext(input.scenarioId, input.contextVersion),
        )?.explanation,
      ).not.toContain(expected);
    },
  );
});
