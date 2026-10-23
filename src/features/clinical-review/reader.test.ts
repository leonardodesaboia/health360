import { readerFixture } from "../../../tests/fixtures/clinical-review";
import { describe, expect, it } from "vitest";
import { demoPatient, demoExamination } from "../patients/fixtures";
import {
  buildQueue,
  findWorkspace,
  workspaceId,
  safeEvidenceUrl,
} from "./reader";

describe("physician reader", () => {
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
