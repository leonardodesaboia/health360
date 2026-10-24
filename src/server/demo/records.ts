import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { validateRecord } from "../db/records";
import {
  demoCaseIdSchema,
  demoCaseLabels,
  demoSessionTokenSchema,
  scenarioFor,
  type DemoCaseId,
} from "./contracts";

export function newDemoSessionToken() {
  return randomBytes(32).toString("base64url");
}

/** Hash so the raw cookie token is never stored or used as a database key. */
export function demoDatasetId(token: string) {
  const parsed = demoSessionTokenSchema.parse(token);
  return `demo-${createHash("sha256").update(parsed).digest("hex").slice(0, 32)}`;
}

// Storage records only: no analysis, review, plan or timeline, because no clinical work occurred.
export function demoCaseRecords(caseId: DemoCaseId) {
  const { input } = scenarioFor(demoCaseIdSchema.parse(caseId));
  const { profile, examinations } = structuredClone(input);
  return {
    patient: validateRecord("patient", {
      id: profile.patientId,
      displayName: demoCaseLabels[caseId].displayName,
      synthetic: true,
      status: "NOT_STARTED",
    }),
    examination: examinations.map((exam) =>
      validateRecord("examination", exam),
    ),
    profile: validateRecord("profile", profile),
  };
}
