import "server-only";
import { cookies } from "next/headers";
import { getDatabase } from "../db/client";
import {
  demoSessionCookie,
  demoSessionTokenSchema,
  type DemoSession,
} from "./contracts";
import { demoDatasetId, newDemoSessionToken } from "./records";
import { loadDemoCase, replaceDemoDataset, resetDemoDataset } from "./store";
import { prepareDemoDataset, requirePreparedMockProvider } from "./prepare";
import {
  resolveDemoSelection,
  type PreparedDemoStateId,
} from "./starting-points";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure:
      process.env.NODE_ENV === "production" ||
      process.env.DEMO_COOKIE_SECURE === "true",
  };
}

async function activatePreparedState(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  stateId: PreparedDemoStateId,
) {
  requirePreparedMockProvider();
  const token = newDemoSessionToken();
  const datasetId = demoDatasetId(token);
  const db = getDatabase();
  await prepareDemoDataset(db, datasetId, stateId);
  try {
    cookieStore.set(demoSessionCookie, token, cookieOptions());
  } catch (error) {
    // Only the newly allocated scope is disposable; the previous session stays intact.
    await db.dataset.deleteMany({ where: { id: datasetId } });
    throw error;
  }
}

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
export async function selectDemoCaseForSession(
  caseId: unknown,
): Promise<string | null> {
  const selected = resolveDemoSelection(caseId);
  const cookieStore = await cookies();
  if (selected.preparedStateId) {
    await activatePreparedState(cookieStore, selected.preparedStateId);
    return selected.destination;
  }
  const parsed = demoSessionTokenSchema.safeParse(
    cookieStore.get(demoSessionCookie)?.value,
  );
  const token = parsed.success ? parsed.data : newDemoSessionToken();
  await replaceDemoDataset(
    getDatabase(),
    demoDatasetId(token),
    selected.caseId,
  );
  cookieStore.set(demoSessionCookie, token, cookieOptions());
  return null;
}

/** No client-supplied dataset ID or case ID can change reset scope. */
export async function resetDemoSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = demoSessionTokenSchema.safeParse(
    cookieStore.get(demoSessionCookie)?.value,
  );
  if (!token.success) return false;
  const db = getDatabase();
  const selected = await loadDemoCase(db, demoDatasetId(token.data));
  if (selected?.preparedStateId) {
    await activatePreparedState(cookieStore, selected.preparedStateId);
    return true;
  }
  return resetDemoDataset(db, demoDatasetId(token.data));
}

export type { DemoSession, StoredDemoCase, DemoCaseId } from "./contracts";
