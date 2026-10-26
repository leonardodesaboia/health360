import "server-only";
import { z } from "zod";
import type {
  Patient,
  HealthProfile,
  PreviousExamination,
} from "../../features/patients/contracts";
import type { DemoContext } from "../clinical-rules/contracts";
import { demoScenarios } from "../clinical-rules/scenarios";
import type { PreparedDemoStateId } from "./starting-points";

// Demonstration navigation state only. A demo session is never an identity or authorization.
export const demoCaseIds = ["first-screening", "repeat-screening"] as const;
export const demoCaseIdSchema = z.enum(demoCaseIds);
export type DemoCaseId = z.infer<typeof demoCaseIdSchema>;

// Opaque random token (32 bytes, base64url) held in an httpOnly cookie.
export const demoSessionCookie = "h360_demo_session";
export const demoSessionTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, "Invalid demo session token");

export type StoredDemoCase = {
  preparedStateId?: PreparedDemoStateId;
  clinicalContext: DemoContext;
  caseId: DemoCaseId;
  patient: Patient;
  profile: HealthProfile;
  examinations: PreviousExamination[];
};

export type DemoSession = StoredDemoCase & {
  /** Storage scope for every record of this browser's demo case. */
  datasetId: string;
  caseId: DemoCaseId;
  patientId: string;
};

export const demoCaseLabels: Record<
  DemoCaseId,
  { displayName: string; summary: string }
> = {
  "first-screening": {
    displayName: "Alex Example",
    summary: "Synthetic, age 50 · No previous colorectal screening reported",
  },
  "repeat-screening": {
    displayName: "Jordan Example",
    summary: "Synthetic, age 60 · Reports a normal colonoscopy on Nov 3, 2022",
  },
};

export function scenarioFor(caseId: DemoCaseId) {
  const scenario = demoScenarios.find((item) => item.id === caseId);
  if (!scenario) throw new Error("Unsupported synthetic scenario");
  return scenario;
}
