"use server";
import { revalidatePath } from "next/cache";
import {
  resetDemoSession,
  selectDemoCaseForSession,
} from "@/server/demo/session";

// Demonstration navigation only: these actions never grant identity or clinical authority.
export async function selectDemoCase(formData: FormData) {
  await selectDemoCaseForSession(formData.get("caseId"));
  revalidatePath("/", "layout");
}

export async function resetDemo() {
  await resetDemoSession();
  revalidatePath("/", "layout");
}
