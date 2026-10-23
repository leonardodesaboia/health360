import "server-only";
import type { ClinicalContext } from "../../features/patients/contracts";
import { loadClinicalContext } from "../clinical-rules/context";

/** Stored URLs alone cannot turn placeholder or fabricated evidence into support. */
export function validatePublicationContext(context: ClinicalContext) {
  const canonical = loadClinicalContext(context.scenarioId, context.version);
  if (
    context.id !== canonical.id ||
    context.ruleIds.length !== canonical.ruleIds.length ||
    context.ruleIds.some((id) => !canonical.ruleIds.includes(id)) ||
    context.evidence.length !== canonical.evidence.length ||
    context.evidence.some(
      (e) =>
        !canonical.evidence.some(
          (source) =>
            source.id === e.id &&
            source.version === e.version &&
            source.title === e.title &&
            source.sourceUrl === e.sourceUrl &&
            source.evidenceStatus === "public_source",
        ),
    )
  )
    throw new Error(
      "Publication requires the current supported demonstrative context",
    );
}
