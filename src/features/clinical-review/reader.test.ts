import { readerFixture } from "../../../tests/fixtures/clinical-review";
import { describe, expect, it } from "vitest";
import { demoPatient, demoExamination } from "../patients/fixtures";
import { intakeFactsSchema } from "../patients/contracts";
import {
  buildQueue,
  findWorkspace,
  workspaceId,
  safeEvidenceUrl,
  reviewableProposals,
  declaredFacts,
} from "./reader";

describe("physician reader", () => {
  it("distinguishes declared yes, no and unknown screening facts", () => {
    const data = readerFixture();
    const facts = intakeFactsSchema.parse(
      Object.fromEntries(
        Object.keys(intakeFactsSchema.shape).map((key) => [
          key,
          key === "provenance" ? "PATIENT_REPORTED" : null,
        ]),
      ),
    );
    facts.rectalBleeding = true;
    facts.bowelChange = false;
    const displayed = declaredFacts({
      ...data.profiles[0],
      intakeFacts: facts,
    });
    expect(displayed.find((item) => item.id === "rectalBleeding")?.text).toBe(
      "Yes",
    );
    expect(displayed.find((item) => item.id === "bowelChange")?.text).toBe(
      "No",
    );
    expect(displayed.find((item) => item.id === "weightLoss")?.text).toBe(
      "Unknown",
    );
    expect(declaredFacts(data.profiles[0])).toEqual([]);
  });
  it("does not expose proposal content from a blocked analysis", () => {
    const { analyses } = readerFixture();
    expect(reviewableProposals(analyses[0])).toHaveLength(1);
    expect(reviewableProposals({ ...analyses[0], status: "BLOCKED" })).toEqual(
      [],
    );
  });
  it("rejects unsafe evidence links", () => {
    expect(safeEvidenceUrl("javascript:alert(1)")).toBeNull();
    expect(safeEvidenceUrl("file:///private")).toBeNull();
    expect(safeEvidenceUrl(null)).toBeNull();
    expect(safeEvidenceUrl("https://example.org/guideline")).toBe(
      "https://example.org/guideline",
    );
  });
  it("uses the actual timestamp and latest analysis for the scoped patient", () => {
    const data = readerFixture();
    data.analyses.push({ ...data.analyses[0], id: "new", version: 2 });
    expect(buildQueue(data, demoPatient.id)).toMatchObject([
      { analysis: { id: "new", createdAt: "2026-10-23T12:34:56Z" } },
    ]);
    expect(buildQueue(data, "foreign")).toEqual([]);
    expect(buildQueue({ ...data, analyses: [] }, demoPatient.id)).toEqual([]);
  });
  it("rejects unknown and cross-patient workspaces", () => {
    const data = readerFixture();
    expect(findWorkspace(data, demoPatient.id, "invalid")).toBeNull();
    expect(
      findWorkspace(data, "foreign", workspaceId(data.analyses[0])),
    ).toBeNull();
  });
  it("resolves a persisted review ID to its exact analysis without cross-patient disclosure", () => {
    const data = readerFixture();
    data.reviews.push({
      id: "persisted-review",
      version: 1,
      patientId: demoPatient.id,
      analysisId: data.analyses[0].id,
      analysisVersion: 1,
      reviewerId: "demo-physician",
      completedAt: null,
      decisions: [],
    });
    expect(
      findWorkspace(data, demoPatient.id, "persisted-review")?.analysis.id,
    ).toBe(data.analyses[0].id);
    expect(findWorkspace(data, "foreign", "persisted-review")).toBeNull();
  });
  it("preserves exact profile, unknowns and evidence versions", () => {
    const data = readerFixture();
    const result = findWorkspace(
      data,
      demoPatient.id,
      workspaceId(data.analyses[0]),
    );
    expect(result?.profile.familyHistory[0].value).toBeNull();
    expect(result?.context.evidence[0]).toMatchObject({
      id: "source",
      version: 2,
      sourceUrl: null,
    });
    expect(result?.examinations).toEqual([demoExamination]);
    expect(result?.stale).toBe(false);
  });
  it("warns on newer profile, context or analysis and rejects broken references", () => {
    for (const kind of ["profiles", "contexts", "analyses"] as const) {
      const data = readerFixture();
      if (kind === "profiles")
        data.profiles.push({
          ...data.profiles[0],
          id: "profile-2",
          version: 2,
        });
      if (kind === "contexts")
        data.contexts.push({ ...data.contexts[0], version: 2 });
      if (kind === "analyses")
        data.analyses.push({ ...data.analyses[0], version: 2 });
      expect(
        findWorkspace(data, demoPatient.id, workspaceId(data.analyses[0]))
          ?.stale,
      ).toBe(true);
    }
    const data = readerFixture();
    data.contexts = [];
    expect(
      findWorkspace(data, demoPatient.id, workspaceId(data.analyses[0])),
    ).toBeNull();
  });
});
