import { describe, expect, it } from "vitest";
import { historyFixture } from "./test-fixtures";
import { buildPatientHistory } from "./history";

describe("patient longitudinal history", () => {
  it("orders actual events chronologically and shows versions and provenance", () => {
    const { records, patientId } = historyFixture();
    const history = buildPatientHistory(records, patientId);
    expect(history.events.map((e) => e.kind)).toEqual([
      "PROFILE_UPDATED",
      "INTAKE_COMPLETED",
      "ANALYSIS_CREATED",
      "REVIEW_COMPLETED",
      "PLAN_PUBLISHED",
    ]);
    expect(history.events[0]).toMatchObject({
      title: "Profile created",
      entityVersion: 1,
      provenanceLabel: "Patient-reported",
    });
    expect(history.events[3].provenanceLabel).toBe("Physician-reviewed");
    expect(history.plans).toMatchObject([
      { id: "plan-1", version: 1, profileVersion: 1, reviewVersion: 1 },
    ]);
  });

  it("deduplicates the same kind/entity/version and breaks equal-time ties deterministically", () => {
    const { records, patientId } = historyFixture();
    records.events.push({ ...records.events[0], id: "duplicate" });
    records.events[1].occurredAt = records.events[2].occurredAt;
    const forward = buildPatientHistory(records, patientId);
    records.events.reverse();
    expect(buildPatientHistory(records, patientId)).toEqual(forward);
    expect(forward.events).toHaveLength(5);
  });

  it("excludes another patient's events and plans even when entity IDs match", () => {
    const { records, patientId } = historyFixture();
    records.events.push({
      ...records.events[0],
      id: "foreign-event",
      patientId: "other",
    });
    records.plans.push({
      ...records.plans[0],
      id: "foreign-plan",
      patientId: "other",
    });
    const history = buildPatientHistory(records, patientId);
    expect(history.events).toHaveLength(5);
    expect(history.plans).toHaveLength(1);
    expect(buildPatientHistory(records, "other").events).toHaveLength(0);
  });

  it("does not manufacture events for existing records with no recorded event", () => {
    const { records, patientId } = historyFixture();
    records.events = [];
    expect(buildPatientHistory(records, patientId).events).toEqual([]);
  });

  it("hides orphaned versions and unfinished review events", () => {
    const { records, patientId } = historyFixture();
    records.events[4].entityVersion = 99;
    records.reviews[0].completedAt = null;
    const history = buildPatientHistory(records, patientId);
    expect(history.events.map((e) => e.kind)).not.toContain("REVIEW_COMPLETED");
    expect(history.events).toHaveLength(2);
    expect(history.plans).toHaveLength(0);
  });

  it("does not expose analysis/proposal text through timeline entries", () => {
    const { records, patientId } = historyFixture();
    records.analyses[0].summary = "PRIVATE PRELIMINARY EXPLANATION";
    records.analyses[0].reviewQuestions = ["UNREVIEWED QUESTION"];
    const output = JSON.stringify(buildPatientHistory(records, patientId));
    expect(output).not.toContain("PRIVATE PRELIMINARY");
    expect(output).not.toContain("UNREVIEWED QUESTION");
  });
  it.each([
    ["REASSESSMENT_REQUESTED", "profile", "Reassessment requested"],
    ["CLARIFICATION_ANSWERED", "profile", "Information updated"],
    ["ANALYSIS_FAILED", "analysis", "Analysis not completed"],
    ["CLARIFICATION_REQUESTED", "analysis", "More information requested"],
    ["REVIEW_UPDATED", "review", "Demonstration review updated"],
    [
      "REVIEW_CLARIFICATION_REQUESTED",
      "review",
      "Reviewer requested more information",
    ],
  ])(
    "includes the consolidated %s event with its real entity link",
    (kind, entity, title) => {
      const { records, patientId } = historyFixture();
      const reference =
        entity === "profile"
          ? records.profiles[0]
          : entity === "analysis"
            ? records.analyses[0]
            : records.reviews[0];
      const event = {
        ...records.events[0],
        id: "extra",
        entityId: reference.id,
        entityVersion: reference.version,
      };
      Object.assign(event, { kind });
      records.events.push(event);
      expect(
        buildPatientHistory(records, patientId).events.some(
          (e) => e.title === title,
        ),
      ).toBe(true);
      event.entityVersion = 99;
      expect(
        buildPatientHistory(records, patientId).events.some(
          (e) => e.title === title,
        ),
      ).toBe(false);
    },
  );

  it("preserves original data and both plan versions across a new cycle", () => {
    const { records, patientId } = historyFixture();
    records.profiles.push({
      ...records.profiles[0],
      id: "profile-2",
      version: 2,
    });
    records.analyses.push({
      ...records.analyses[0],
      id: "analysis-2",
      version: 2,
      profileVersion: 2,
    });
    records.reviews.push({
      ...records.reviews[0],
      id: "review-2",
      analysisId: "analysis-2",
      analysisVersion: 2,
    });
    records.plans.push({
      ...records.plans[0],
      id: "plan-2",
      version: 2,
      reviewId: "review-2",
      profileVersion: 2,
      previousPlanId: "plan-1",
    });
    const snapshot = structuredClone(records);
    const history = buildPatientHistory(records, patientId);
    expect(history.plans.map((p) => p.version)).toEqual([2, 1]);
    expect(records).toEqual(snapshot);
  });
});
