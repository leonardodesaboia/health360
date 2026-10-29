import "server-only";
import { intakeFactsSchema } from "../../features/patients/contracts";
import { screeningFactsSchema } from "../clinical-rules/contracts";
import { triStateOr } from "./input";

/** Parse the shared typed intake contract; legacy or invalid data stays unknown. */
export function mapIntakeFacts(raw: unknown) {
  const parsed = intakeFactsSchema.safeParse(raw);
  const facts = parsed.success ? parsed.data : null;
  return screeningFactsSchema.parse({
    provenance: "PATIENT_REPORTED",
    symptoms: triStateOr([
      facts?.rectalBleeding ?? null,
      facts?.bowelChange ?? null,
      facts?.weightLoss ?? null,
    ]),
    personalRiskHistory: triStateOr([
      facts?.colorectalCancer ?? null,
      facts?.polyps ?? null,
      facts?.ibd ?? null,
      facts?.hereditaryCancerSyndrome ?? null,
      facts?.serratedPolyposis ?? null,
    ]),
    familyRiskHistory: triStateOr([
      facts?.familyCrc ?? null,
      facts?.familySyndrome ?? null,
    ]),
    ...(facts && (facts.familyCrc !== false || facts.familySyndrome !== false)
      ? {
          familyCrc: facts.familyCrc,
          familySyndrome: facts.familySyndrome,
          familyCrcFirstDegree: facts.familyCrcFirstDegree ?? null,
          familyCrcDiagnosisAge: facts.familyCrcDiagnosisAge ?? null,
        }
      : {}),
    priorScreening: facts?.priorScreening ?? null,
    normal: facts?.colonoscopyNormal ?? null,
    complete: facts?.colonoscopyComplete ?? null,
    adequatePreparation: facts?.colonoscopyAdequatePrep ?? null,
  });
}
