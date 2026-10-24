import { demoCaseIds, demoCaseLabels } from "@/server/demo/contracts";
import { DemoControlsClient } from "./demo-controls-client";

/** Presenter controls. Choosing a case is demo navigation, not sign-in or authorization. */
export function DemoControls() {
  return (
    <DemoControlsClient
      cases={demoCaseIds.map((id) => ({
        id,
        displayName: demoCaseLabels[id].displayName,
      }))}
    />
  );
}
