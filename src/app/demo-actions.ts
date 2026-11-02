"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  buildFallbackScenarioState,
  LOCAL_DEMO_COOKIE,
  resetLocalFallbackCase,
} from "@/server/clinical-review/service";
import { demoCaseIdSchema } from "@/server/demo/contracts";
import {
  resetDemoSession,
  selectDemoCaseForSession,
} from "@/server/demo/session";

// Demonstration navigation only: these actions never grant identity or clinical authority.
export async function selectDemoCase(formData: FormData) {
  const rawCaseId = formData.get("caseId");
  const parsed = demoCaseIdSchema.safeParse(rawCaseId);
  if (parsed.success) {
    const cookieStore = await cookies();
    cookieStore.set(LOCAL_DEMO_COOKIE, parsed.data, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    await buildFallbackScenarioState(parsed.data);
  }
  try {
    await selectDemoCaseForSession(rawCaseId);
  } catch {
    // Handled via local fallback cookie when PostgreSQL is offline
  }
  revalidatePath("/", "layout");
}

export async function resetDemo() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCAL_DEMO_COOKIE)?.value;
  const parsed = demoCaseIdSchema.safeParse(raw);
  if (parsed.success) {
    await resetLocalFallbackCase(parsed.data);
  }
  try {
    await resetDemoSession();
  } catch {
    // Handled via local fallback reset when PostgreSQL is offline
  }
  revalidatePath("/", "layout");
}
