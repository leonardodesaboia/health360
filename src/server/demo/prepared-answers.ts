import "server-only";
import { fieldIds, intakeSchema } from "../../features/health-intake/contracts";
import type { DemoCaseId } from "./contracts";

/** Explicit fictional answers for presentation preparation, never unknown-value defaults. */
export function preparedIntakeAnswers(caseId: DemoCaseId) {
  const repeat = caseId === "repeat-screening";
  return intakeSchema.parse({
    ...Object.fromEntries(fieldIds.map((field) => [field, null])),
    age: repeat ? "60" : "50",
    rectalBleeding: "no",
    bowelChange: "no",
    weightLoss: "no",
    colorectalCancer: "no",
    polyps: "no",
    ibd: "no",
    hereditaryCancerSyndrome: "no",
    serratedPolyposis: "no",
    familyCrc: "no",
    familySyndrome: "no",
    medications: "None",
    smoking: "no",
    activity: "yes",
    priorScreening: repeat ? "COLONOSCOPY" : "NEVER_SCREENED",
    examDatePrecision: repeat ? "EXACT" : null,
    examDate: repeat ? "2022-11-03" : null,
    colonoscopyNormal: repeat ? "yes" : null,
    colonoscopyComplete: repeat ? "yes" : null,
    colonoscopyAdequatePrep: repeat ? "yes" : null,
  });
}
