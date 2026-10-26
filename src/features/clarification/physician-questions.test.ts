import { expect, it } from "vitest";
import { selectPhysicianQuestions } from "./physician-questions";
import { applyRequestedAnswers } from "./questions";
import { initialAnswers } from "../health-intake/contracts";

it("uses the physician question for known targets and text only when no target is named", () => {
  const result = selectPhysicianQuestions([
    {
      proposalId: "a",
      question: "Please confirm your age.",
      targetField: "age",
    },
    { proposalId: "b", question: "What would you like the reviewer to know?" },
  ]);
  expect(result.questions).toMatchObject([
    { id: "age", label: "Please confirm your age." },
  ]);
  expect(result.freeQuestions).toEqual([
    { id: "physician-1", label: "What would you like the reviewer to know?" },
  ]);
  expect(result.unsupported).toEqual([]);
});
it("keeps unsupported named targets blocked and preserves all questions for duplicate fields", () => {
  const result = selectPhysicianQuestions([
    { proposalId: "a", question: "Confirm age.", targetField: "age" },
    { proposalId: "b", question: "Is this age current?", targetField: "age" },
    { proposalId: "c", question: "Unsupported?", targetField: "privateField" },
  ]);
  expect(result.questions).toHaveLength(1);
  expect(result.questions[0].label).toBe("Confirm age. Is this age current?");
  expect(result.unsupported).toEqual(["privateField"]);
});
it("validates conditional bounded targets even when ordinary intake hides them", () => {
  const current = Object.fromEntries(
    Object.keys(initialAnswers).map((id) => [id, null]),
  ) as typeof initialAnswers;
  current.priorScreening = "NEVER_SCREENED";
  const { questions } = selectPhysicianQuestions([
    {
      proposalId: "a",
      question: "Was preparation adequate?",
      targetField: "colonoscopyAdequatePrep",
    },
  ]);
  expect(() =>
    applyRequestedAnswers(current, questions, {
      colonoscopyAdequatePrep: "invented",
    }),
  ).toThrow("Invalid");
  expect(
    applyRequestedAnswers(current, questions, { colonoscopyAdequatePrep: null })
      .colonoscopyAdequatePrep,
  ).toBeNull();
});
