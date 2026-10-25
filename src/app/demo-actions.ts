"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  buildFallbackScenarioState,
  LOCAL_DEMO_COOKIE,
} from "@/server/clinical-review/service";
import { demoCaseIdSchema } from "@/server/demo/contracts";
import {
  resetDemoSession,
  selectDemoCaseForSession,
} from "@/server/demo/session";

// Demonstration navigation only: these actions never grant identity or clinical authority.
export async function selectDemoCase(formData: FormData) {
  const rawCaseId = formData.get("caseId");
  try {
    await selectDemoCaseForSession(rawCaseId);
  } catch {
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
  }
  revalidatePath("/", "layout");
}

export async function resetDemo() {
  try {
    await resetDemoSession();
  } catch {
    const cookieStore = await cookies();
    cookieStore.delete(LOCAL_DEMO_COOKIE);
  }
  revalidatePath("/", "layout");
}
