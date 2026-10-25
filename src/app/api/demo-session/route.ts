import { NextResponse } from "next/server";
import { getActiveLocalFallback } from "@/server/clinical-review/service";
import { demoCaseLabels } from "@/server/demo/contracts";
import { getDemoSession } from "@/server/demo/session";

// Minimal presenter state for the shell controls; no profile or clinical data leaves here.
export async function GET() {
  try {
    const session = await getDemoSession();
    if (session) {
      return NextResponse.json(
        {
          caseId: session.caseId,
          displayName: session.patient.displayName,
          summary: demoCaseLabels[session.caseId].summary,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
  } catch {
    // Fall back to local scenario cookie when PostgreSQL is offline.
  }

  const local = await getActiveLocalFallback();
  return NextResponse.json(
    local
      ? {
          caseId: local.caseId,
          displayName: local.patient.displayName,
          summary: demoCaseLabels[local.caseId].summary,
        }
      : null,
    { headers: { "Cache-Control": "no-store" } },
  );
}
