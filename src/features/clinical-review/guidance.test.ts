import { describe, expect, it } from "vitest";
import { readerFixture } from "../../../tests/fixtures/clinical-review";
import { findWorkspace, workspaceId } from "./reader";
import {
  proposalRuleGuidance,
  queueAction,
  readableConsideredData,
  uniqueDemonstrativeLabel,
  visibleLimitations,
} from "./guidance";

describe("queue action guidance", () => {
  const data = readerFixture();
  const workspace = findWorkspace(
    data,
    data.patients[0].id,
    workspaceId(data.analyses[0]),
  )!;
  it("prioritizes stale, blocked and finalized records over workflow status", () => {
    expect(
      queueAction({
        ...workspace,
        stale: true,
        analysis: { ...workspace.analysis, status: "BLOCKED" },
      }),
    ).toBe("View previous analysis");
    expect(
      queueAction({
        ...workspace,
        analysis: { ...workspace.analysis, status: "BLOCKED" },
      }),
    ).toBe("View blocked analysis");
    expect(
      queueAction({
        ...workspace,
        review: { completedAt: "2026-10-28T12:00:00Z" },
        workflowStatus: "CLARIFICATION_REQUIRED",
      }),
    ).toBe("View finalized review");
  });
  it.each([
    ["CLARIFICATION_REQUIRED", "View clarification status"],
    ["MEDICAL_REVIEW_IN_PROGRESS", "Continue review"],
    ["MEDICAL_REVIEW_PENDING", "Start review"],
    ["ANALYSIS_PENDING", "View analysis status"],
  ] as const)(
    "labels %s without granting permission",
    (workflowStatus, label) => {
      expect(
        queueAction({
          ...workspace,
          review: null,
          stale: false,
          workflowStatus,
        }),
      ).toBe(label);
    },
  );
});

describe("physician display guidance", () => {
  it("shows the recent-test limitation only with redundancy proposals", () => {
    const limitation =
      "A recent test alone does not establish redundancy. Patient-reported examination details require physician verification.";
    const items = [
      limitation,
      "Patient-reported data has not been clinically confirmed.",
    ];
    expect(visibleLimitations(items, "POSSIBLE_REDUNDANCY")).toEqual(items);
    expect(visibleLimitations(items, "PREVENTIVE_OPPORTUNITY")).toEqual([
      items[1],
    ]);
    expect(visibleLimitations(items)).toEqual([items[1]]);
  });
  it("labels known facts, preserves unknowns and identifies provenance", () => {
    expect(
      readableConsideredData(
        [
          "personalRiskHistory: false",
          "familyRiskHistory: unknown",
          "symptoms: true",
          "provenance: PATIENT_REPORTED",
          "priorScreening: NEVER_SCREENED",
          "Unfamiliar supplied text",
        ],
        false,
      ),
    ).toEqual([
      "Personal risk history: No",
      "Family risk history: Unknown",
      "Symptoms: Yes",
      "Patient-reported",
      "Previous colorectal screening: Never screened",
      "Unfamiliar supplied text",
    ]);
  });
  it("hides colonoscopy quality facts when no colonoscopy is reported", () => {
    expect(
      readableConsideredData(
        [
          "priorScreening: NEVER_SCREENED",
          "normal: unknown",
          "complete: unknown",
          "adequatePreparation: unknown",
        ],
        false,
      ),
    ).toEqual(["Previous colorectal screening: Never screened"]);
  });
  it("preserves unsupported keys and values without interpreting them", () => {
    expect(
      readableConsideredData(
        ["custom: false", "symptoms: toString", "provenance: __proto__"],
        false,
      ),
    ).toEqual(["custom: false", "Symptoms: toString", "provenance: __proto__"]);
  });
  it.each([true, false])(
    "keeps quality facts including Unknown when colonoscopy is reported (profile: %s)",
    (reported) => {
      expect(
        readableConsideredData(
          [
            ...(reported ? [] : ["priorScreening: COLONOSCOPY"]),
            "normal: unknown",
            "complete: true",
            "adequatePreparation: false",
          ],
          reported,
        ),
      ).toEqual([
        ...(reported ? [] : ["Previous colorectal screening: Colonoscopy"]),
        "Colonoscopy result was normal: Unknown",
        "Colonoscopy was complete: Yes",
        "Colonoscopy preparation was adequate: No",
      ]);
    },
  );
  it("retains one summary disclaimer without changing preliminary wording", () => {
    const label = "DEMONSTRATIVE — NOT CLINICALLY VALIDATED";
    expect(
      uniqueDemonstrativeLabel(
        `${label}. Preliminary proposal, awaiting physician review. ${label}. Synthetic summary.`,
      ),
    ).toBe(
      `${label}. Preliminary proposal, awaiting physician review. Synthetic summary.`,
    );
    expect(uniqueDemonstrativeLabel(`${label}. Synthetic summary.`)).toBe(
      `${label}. Synthetic summary.`,
    );
  });
});

it("shows proposed action and reason from rule provenance without attributing AI text to rules", () => {
  const rationale =
    "Discuss starting colorectal screening by colonoscopy now because a parent, sibling or child was diagnosed with colorectal cancer at age 50. Verify the family history.";
  expect(proposalRuleGuidance([{ rationale }])).toEqual([
    {
      proposed: "Discuss starting colorectal screening by colonoscopy now",
      why: "a parent, sibling or child was diagnosed with colorectal cancer at age 50.",
    },
  ]);
  expect(proposalRuleGuidance([])).toEqual([]);
});
