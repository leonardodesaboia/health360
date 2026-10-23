import { describe, expect, it } from "vitest";
import { intakeSchema, initialAnswers } from "./contracts";
import { createDraftRepository } from "./repository";

describe("synthetic intake draft", () => {
  it("preserves unknown answers without inventing negative facts", () => {
    const answers = Object.fromEntries(
      Object.keys(initialAnswers).map((id) => [id, null]),
    );
    expect(intakeSchema.parse(answers)).toEqual(answers);
  });
  it("rejects unanswered questions and invalid age or choices", () => {
    expect(intakeSchema.safeParse(initialAnswers).success).toBe(false);
    expect(
      intakeSchema.safeParse({ ...initialAnswers, age: "121" }).success,
    ).toBe(false);
    const answers = Object.fromEntries(
      Object.keys(initialAnswers).map((id) => [id, "no"]),
    );
    expect(
      intakeSchema.safeParse({
        ...answers,
        age: "52",
        priorScreening: "NEVER_SCREENED",
      }).success,
    ).toBe(true);
    expect(
      intakeSchema.safeParse({
        ...answers,
        age: "52",
        priorScreening: "NEVER_SCREENED",
        ibd: "normal",
      }).success,
    ).toBe(false);
  });
  it("requires conditional history details and retains explicit unknown details", () => {
    const answers = Object.fromEntries(
      Object.keys(initialAnswers).map((id) => [id, null]),
    );
    expect(
      intakeSchema.safeParse({
        ...answers,
        colorectalCancer: "yes",
        historyDetails: "",
      }).success,
    ).toBe(false);
    expect(
      intakeSchema.safeParse({
        ...answers,
        colorectalCancer: "yes",
        historyDetails: null,
      }).success,
    ).toBe(true);
  });
  it("restores scoped drafts and rejects stale writes", async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const repo = createDraftRepository(storage);
    const saved = await repo.save("synthetic-a", initialAnswers, 1, 0);
    expect(await repo.load("synthetic-a")).toEqual(saved);
    expect(await repo.load("synthetic-b")).toBeNull();
    await expect(
      repo.save("synthetic-a", initialAnswers, 0, 0),
    ).rejects.toThrow(/newer draft/);
    expect(await repo.load("synthetic-a")).toEqual(saved);
  });
  it("rejects malformed data and propagates unavailable storage", async () => {
    const corrupt = createDraftRepository({
      getItem: () => "{}",
      setItem: () => {
        throw new Error("must not overwrite");
      },
    });
    await expect(corrupt.load("demo")).rejects.toThrow();
    await expect(corrupt.save("demo", initialAnswers, 0, 0)).rejects.toThrow();
    const unavailable = createDraftRepository({
      getItem: () => null,
      setItem: () => {
        throw new Error("Storage unavailable");
      },
    });
    await expect(
      unavailable.save("demo", initialAnswers, 0, 0),
    ).rejects.toThrow("Storage unavailable");
  });
});
