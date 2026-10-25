import { describe, expect, it } from "vitest";
import { initialAnswers } from "../health-intake/contracts";
import { selectQuestions, applyAnswers } from "./questions";

const answers = {
  ...initialAnswers,
  age: null,
  rectalBleeding: "no",
  bowelChange: null,
  weightLoss: null,
};
describe("bounded clarification", () => {
  it("treats object-prototype keys as unsupported data", () => {
    expect(
      selectQuestions(["constructor", "__proto__", "toString"], answers)
        .unsupported,
    ).toHaveLength(3);
  });
  it("normalizes an exact examination date without inventing an unknown date", () => {
    const current = Object.fromEntries(
      Object.keys(initialAnswers).map((id) => [id, null]),
    ) as typeof initialAnswers;
    current.priorScreening = "COLONOSCOPY";
    const known = applyAnswers(current, ["examinations.performedAt"], {
      examDate: "2022-11-03",
    });
    expect(known.examDatePrecision).toBe("EXACT");
    const unknown = applyAnswers(current, ["examinations.performedAt"], {
      examDate: null,
    });
    expect(unknown.examDate).toBeNull();
    expect(unknown.examDatePrecision).toBeNull();
  });
  it("maps a supported age gap and rejects unsupported field paths", () => {
    expect(
      selectQuestions(["profile.age", "private.secret"], answers),
    ).toMatchObject({
      questions: [{ id: "age" }],
      unsupported: ["private.secret"],
    });
  });
  it("expands an aggregate only to its unknown underlying facts and deduplicates", () => {
    expect(
      selectQuestions(
        ["facts.symptoms", "profile.missingInformation:Change in bowel habits"],
        answers,
      ).questions.map((q) => q.id),
    ).toEqual(["bowelChange", "weightLoss"]);
  });
  it("preserves explicit unknown and rejects unrelated or absent answers", () => {
    const current = Object.fromEntries(
      Object.keys(initialAnswers).map((id) => [id, null]),
    ) as typeof initialAnswers;
    expect(
      applyAnswers(current, ["profile.age"], { age: null }).age,
    ).toBeNull();
    expect(applyAnswers(current, ["profile.age"], { age: "60" }).age).toBe(
      "60",
    );
    expect(() =>
      applyAnswers(current, ["profile.age"], { age: "60", smoking: "no" }),
    ).toThrow();
    expect(() => applyAnswers(current, ["profile.age"], {})).toThrow();
    expect(() => applyAnswers(current, ["private.secret"], {})).toThrow();
    expect(() =>
      applyAnswers(current, ["profile.age"], { age: "invalid" }),
    ).toThrow();
  });
});
