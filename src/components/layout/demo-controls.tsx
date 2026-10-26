import { demoCaseIds, demoCaseLabels } from "@/server/demo/contracts";
import { DemoControlsClient } from "./demo-controls-client";
import { preparedDemoStates } from "@/server/demo/starting-points";

/** Presenter controls. Choosing a case is demo navigation, not sign-in or authorization. */
export function DemoControls() {
  return (
    <DemoControlsClient
      preparedStates={preparedDemoStates.map(({ id, label }) => ({
        id,
        label,
      }))}
      cases={demoCaseIds.map((id) => ({
        id,
        displayName: demoCaseLabels[id].displayName,
      }))}
    />
  );
}
