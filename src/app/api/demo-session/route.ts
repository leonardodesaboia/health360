import { NextResponse } from "next/server";
import { demoCaseLabels } from "../../../server/demo/contracts";
import { getDemoSession } from "../../../server/demo/session";

// Minimal presenter state for the shell controls; no profile or clinical data leaves here.
export async function GET() {
  try {
    const session = await getDemoSession();
    return NextResponse.json(
      session
        ? {
            caseId: session.caseId,
            displayName: session.patient.displayName,
            summary: demoCaseLabels[session.caseId].summary,
          }
        : null,
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
