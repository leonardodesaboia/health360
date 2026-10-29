import { NextResponse } from "next/server";
import { demoCaseLabels } from "../../../server/demo/contracts";
import { getDemoPresenterSession } from "../../../server/demo/session";
import {
  preparedDemoState,
  preparedStatesAvailable,
} from "../../../server/demo/starting-points";

// Minimal presenter state for the shell controls; no profile or clinical data leaves here.
export async function GET() {
  try {
    const session = await getDemoPresenterSession();
    return NextResponse.json(
      {
        session: session
          ? {
              caseId: session.caseId,
              displayName: session.displayName,
              summary: session.preparedStateId
                ? `${demoCaseLabels[session.caseId].summary}. Prepared starting point: ${preparedDemoState(session.preparedStateId).label}. DEMONSTRATIVE — NOT CLINICALLY VALIDATED`
                : demoCaseLabels[session.caseId].summary,
              ...(session.preparedStateId
                ? { preparedStateId: session.preparedStateId }
                : {}),
            }
          : null,
        preparedStatesAvailable: preparedStatesAvailable(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
