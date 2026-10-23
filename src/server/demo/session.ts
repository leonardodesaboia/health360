import "server-only";
import { cookies } from "next/headers";
import { getDatabase } from "../db/client";
import {
  demoCaseIdSchema,
  demoSessionCookie,
  demoSessionTokenSchema,
  type DemoSession,
} from "./contracts";
import { demoDatasetId, newDemoSessionToken } from "./records";
import { loadDemoCase, replaceDemoDataset, resetDemoDataset } from "./store";

/** Read-only browser demo context. This cookie grants no real identity or clinical authority. */
export async function getDemoSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies();
  const token = demoSessionTokenSchema.safeParse(
    cookieStore.get(demoSessionCookie)?.value,
  );
  if (!token.success) return null;
  const datasetId = demoDatasetId(token.data);
  const selected = await loadDemoCase(getDatabase(), datasetId);
  return selected
    ? { ...selected, datasetId, patientId: selected.patient.id }
    : null;
}

/** Invoke only from a Server Action/Route Handler; validates the case before any writes. */
export async function selectDemoCaseForSession(caseId: unknown): Promise<void> {
  const selected = demoCaseIdSchema.parse(caseId);
  const cookieStore = await cookies();
  const parsed = demoSessionTokenSchema.safeParse(
    cookieStore.get(demoSessionCookie)?.value,
  );
  const token = parsed.success ? parsed.data : newDemoSessionToken();
  await replaceDemoDataset(getDatabase(), demoDatasetId(token), selected);
  cookieStore.set(demoSessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.DEMO_COOKIE_SECURE === "true",
  });
}

/** No client-supplied dataset ID or case ID can change reset scope. */
export async function resetDemoSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = demoSessionTokenSchema.safeParse(
    cookieStore.get(demoSessionCookie)?.value,
  );
  if (!token.success) return false;
  return resetDemoDataset(getDatabase(), demoDatasetId(token.data));
}

export type { DemoSession, StoredDemoCase, DemoCaseId } from "./contracts";
