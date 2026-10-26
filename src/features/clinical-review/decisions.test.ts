import { describe, expect, it } from "vitest";
import { readerFixture } from "../../../tests/fixtures/clinical-review";
import { findWorkspace, workspaceId } from "./reader";
import { decisionInputSchema, prepareReview } from "./decisions";

function fixture() {
  const data = readerFixture();
  data.contexts[0].evidence[0].sourceUrl = "https://example.org/test-source";
  return findWorkspace(
    data,
    data.patients[0].id,
    workspaceId(data.analyses[0]),
  )!;
}
const decision = {
  proposalId: "proposal-1",
  decision: "APPROVE",
  reason: "",
  revisedText: null,
};
const now = "2026-10-23T13:00:00Z";
function prepare(overrides = {}, intent: "save" | "finalize" = "finalize") {
  return prepareReview(
    fixture(),
    {
      expectedReviewVersion: 0,
      decisions: [{ ...decision, ...overrides }],
      intent,
    },
    now,
    "new-review",
  );
}

describe("physician decision guards", () => {
  it("requires a reason for modification and rejection and revised text for modification", () => {
    expect(() =>
      prepare({ decision: "MODIFY", revisedText: "Revised" }),
    ).toThrow(/reason/i);
    expect(() => prepare({ decision: "REJECT", reason: "   " })).toThrow(
      /reason/i,
    );
    expect(() =>
      prepare({ decision: "MODIFY", reason: "Explanation" }),
    ).toThrow(/revised/i);
    expect(
      prepare({
        decision: "MODIFY",
        reason: "Explanation",
        revisedText: "Revised",
      }).decisions[0].revisedText,
    ).toBe("Revised");
    expect(
      prepare({ decision: "REJECT", reason: "Explanation" }).decisions[0]
        .decision,
    ).toBe("REJECT");
  });
  it("blocks completion for pending/clarify but permits drafts", () => {
    const clarification = { question: "When was your last colonoscopy?" };
    for (const overrides of [
      { decision: "PENDING" },
      { decision: "CLARIFY", clarification },
    ]) {
      expect(() => prepare(overrides)).toThrow(/pending|clarification/i);
      expect(prepare(overrides, "save").completedAt).toBeNull();
    }
  });
  it("stores a typed clarification question only for CLARIFY", () => {
    expect(() => prepare({ decision: "CLARIFY" }, "save")).toThrow(/question/i);
    expect(() =>
      prepare(
        { decision: "CLARIFY", clarification: { question: "  " } },
        "save",
      ),
    ).toThrow(/question/i);
    expect(() =>
      prepare(
        {
          decision: "CLARIFY",
          clarification: { question: "Why?", targetField: "notAField" },
        },
        "save",
      ),
    ).toThrow();
    expect(() =>
      prepare({ decision: "APPROVE", clarification: { question: "Why?" } }),
    ).toThrow(/only clarification/i);
    const saved = prepare(
      {
        decision: "CLARIFY",
        clarification: {
          question: "  What screening have you had before?  ",
          targetField: "priorScreening",
        },
      },
      "save",
    );
    expect(saved.decisions[0].clarification).toEqual({
      question: "What screening have you had before?",
      targetField: "priorScreening",
    });
    expect(prepare().decisions[0].clarification).toBeNull();
  });
  it("records server reviewer/time and exact analysis version", () => {
    expect(prepare()).toMatchObject({
      reviewerId: "demo-physician",
      completedAt: now,
      analysisId: "synthetic-analysis",
      analysisVersion: 1,
      version: 1,
      decisions: [{ recordedAt: now }],
    });
    expect(
      decisionInputSchema.safeParse({ ...decision, reviewerId: "forged" })
        .success,
    ).toBe(false);
  });
  it("rejects missing, duplicate and foreign proposals", () => {
    const workspace = fixture();
    for (const decisions of [
      [],
      [decision, decision],
      [{ ...decision, proposalId: "foreign" }],
    ]) {
      expect(() =>
        prepareReview(
          workspace,
          { expectedReviewVersion: 0, decisions, intent: "finalize" },
          now,
          "review",
        ),
      ).toThrow(/proposal/i);
    }
  });
  it("rejects stale, blocked, empty and unsupported evidence/rules", () => {
    for (const change of [
      "stale",
      "blocked",
      "empty",
      "evidence",
      "rule",
    ] as const) {
      const workspace = fixture();
      if (change === "stale") workspace.stale = true;
      if (change === "blocked") workspace.analysis.status = "BLOCKED";
      if (change === "empty") workspace.analysis.proposals = [];
      if (change === "evidence") workspace.context.evidence = [];
      if (change === "rule") workspace.context.ruleIds = [];
      expect(() =>
        prepareReview(
          workspace,
          {
            expectedReviewVersion: 0,
            decisions: [decision],
            intent: "finalize",
          },
          now,
          "review",
        ),
      ).toThrow();
    }
  });
  it("rejects placeholder evidence even for approval", () => {
    const workspace = fixture();
    workspace.context.evidence[0].sourceUrl = null;
    expect(() =>
      prepareReview(
        workspace,
        { expectedReviewVersion: 0, decisions: [decision], intent: "finalize" },
        now,
        "review",
      ),
    ).toThrow(/evidence/i);
  });
  it("preserves immutable draft versions and rejects stale or completed requests", () => {
    const workspace = fixture();
    workspace.review = prepare({}, "save");
    const result = prepareReview(
      workspace,
      { expectedReviewVersion: 1, decisions: [decision], intent: "finalize" },
      now,
      "ignored",
    );
    expect(result).toMatchObject({
      id: "new-review",
      version: 2,
      completedAt: now,
    });
    expect(workspace.review.completedAt).toBeNull();
    expect(() =>
      prepareReview(
        workspace,
        { expectedReviewVersion: 0, decisions: [decision], intent: "finalize" },
        now,
        "review",
      ),
    ).toThrow(/changed|stale/i);
    workspace.review = result;
    expect(() =>
      prepareReview(
        workspace,
        { expectedReviewVersion: 2, decisions: [decision], intent: "finalize" },
        now,
        "review",
      ),
    ).toThrow(/finalized/i);
  });
});
