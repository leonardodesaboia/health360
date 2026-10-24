import { describe, expect, it } from "vitest";
import { planInput } from "./test-fixtures";
import { buildReviewedPlan } from "./build";

describe("reviewed plan publication gates", () => {
  it("uses only approved or modified decisions in the matching section", () => {
    const input = planInput();
    const plan = buildReviewedPlan(input);
    expect(plan.actions).toEqual([
      {
        proposalId: "action",
        text: "Reviewed action wording",
        status: "PENDING",
      },
    ]);
    expect(plan.reviewedRedundancies).toEqual(["Revised redundancy wording"]);
    expect(plan.pendingInformation).toEqual(["Reviewed information request"]);
    expect(JSON.stringify(plan)).not.toContain("Rejected proposal");
    expect(plan).toMatchObject({
      reviewId: "review",
      reviewVersion: 1,
      profileVersion: 1,
      version: 1,
      previousPlanId: null,
    });
  });

  it.each(["PENDING", "CLARIFY"] as const)(
    "blocks %s decisions",
    (decision) => {
      const input = planInput();
      input.review.decisions[0].decision = decision;
      expect(() => buildReviewedPlan(input)).toThrow();
    },
  );

  it.each([
    [
      "unfinished review",
      (x: ReturnType<typeof planInput>) => {
        x.review.completedAt = null;
      },
    ],
    [
      "missing decision",
      (x: ReturnType<typeof planInput>) => {
        x.review.decisions.pop();
      },
    ],
    [
      "duplicate decision",
      (x: ReturnType<typeof planInput>) => {
        x.review.decisions[1] = x.review.decisions[0];
      },
    ],
    [
      "unknown proposal",
      (x: ReturnType<typeof planInput>) => {
        x.review.decisions[0].proposalId = "foreign";
      },
    ],
    [
      "missing reason",
      (x: ReturnType<typeof planInput>) => {
        x.review.decisions[1].reason = " ";
      },
    ],
    [
      "missing revised text",
      (x: ReturnType<typeof planInput>) => {
        x.review.decisions[1].revisedText = null;
      },
    ],
    [
      "blocked analysis",
      (x: ReturnType<typeof planInput>) => {
        x.analysis.status = "BLOCKED";
      },
    ],
    [
      "stale profile",
      (x: ReturnType<typeof planInput>) => {
        x.profile.version = 2;
      },
    ],
    [
      "stale analysis",
      (x: ReturnType<typeof planInput>) => {
        x.latestAnalysisVersion = 2;
      },
    ],
    [
      "stale review",
      (x: ReturnType<typeof planInput>) => {
        x.latestReviewVersion = 2;
      },
    ],
    [
      "stale context",
      (x: ReturnType<typeof planInput>) => {
        x.context.version = 2;
      },
    ],
    [
      "foreign patient",
      (x: ReturnType<typeof planInput>) => {
        x.review.patientId = "other";
      },
    ],
    [
      "foreign analysis",
      (x: ReturnType<typeof planInput>) => {
        x.review.analysisId = "other";
      },
    ],
    [
      "foreign profile",
      (x: ReturnType<typeof planInput>) => {
        x.profile.patientId = "other";
      },
    ],
    [
      "unknown evidence",
      (x: ReturnType<typeof planInput>) => {
        x.analysis.proposals[0].evidenceIds = ["unknown"];
      },
    ],
    [
      "missing evidence",
      (x: ReturnType<typeof planInput>) => {
        x.analysis.proposals[0].evidenceIds = [];
      },
    ],
    [
      "placeholder evidence",
      (x: ReturnType<typeof planInput>) => {
        x.context.evidence[0].sourceUrl = null;
      },
    ],
    [
      "unknown rule",
      (x: ReturnType<typeof planInput>) => {
        x.analysis.proposals[0].ruleIds = ["unknown"];
      },
    ],
    [
      "illegal workflow state",
      (x: ReturnType<typeof planInput>) => {
        x.status = "MEDICAL_REVIEW_PENDING";
      },
    ],
  ])("rejects %s", (_, mutate) => {
    const input = planInput();
    mutate(input);
    expect(() => buildReviewedPlan(input)).toThrow();
  });

  it("preserves prior plan and links the next version", () => {
    const input = planInput();
    const previous = buildReviewedPlan(input);
    const snapshot = structuredClone(previous);
    input.previousPlan = previous;
    input.id = "plan-2";
    const plan = buildReviewedPlan(input);
    expect(plan.version).toBe(2);
    expect(plan.previousPlanId).toBe(previous.id);
    expect(previous).toEqual(snapshot);
  });
});
