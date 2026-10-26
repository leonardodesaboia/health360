"use server";
import { revalidatePath } from "next/cache";
import {
  resetDemoSession,
  selectDemoCaseForSession,
  getDemoSession,
} from "@/server/demo/session";
import { preparedDemoState } from "@/server/demo/starting-points";

// Demonstration navigation only: these actions never grant identity or clinical authority.
export async function selectDemoCase(formData: FormData) {
  const destination = await selectDemoCaseForSession(formData.get("caseId"));
  revalidatePath("/", "layout");
  return destination;
}

export async function resetDemo() {
  const reset = await resetDemoSession();
  revalidatePath("/", "layout");
  if (reset) {
    const session = await getDemoSession();
    if (session?.preparedStateId)
      return preparedDemoState(session.preparedStateId).destination;
  }
  return null;
}
