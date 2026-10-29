import { z } from "zod";
import {
  healthProfileSchema,
  intakeResponseSchema,
  previousExaminationSchema,
  intakeFactsSchema,
} from "../patients/contracts";
import {
  fields,
  fieldIds,
  intakeSchema,
  isVisible,
  type FieldId,
  type IntakeAnswers,
} from "./contracts";

export const completedIntakeSchema = z.object({
  submissionId: z.string().min(1),
  synthetic: z.literal(true),
  validation: z.literal("demonstrative"),
  profile: healthProfileSchema,
  examinations: z.array(previousExaminationSchema),
  intake: intakeResponseSchema,
});
export type CompletedIntake = z.infer<typeof completedIntakeSchema>;
export function formatExaminationDate(
  exact: string | null,
  approximate: string | null = null,
): string {
  if (exact && z.iso.date().safeParse(exact).success)
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(exact + "T00:00:00Z"));
  if (approximate && /^\d{4}$/.test(approximate))
    return "Approximate: " + approximate;
  if (approximate && /^\d{4}-(?:0[1-9]|1[0-2])$/.test(approximate))
    return (
      "Approximate: " +
      new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(new Date(approximate + "-01T00:00:00Z"))
    );
  return "Unknown";
}
export function answerLabel(value: string | null) {
  return value === null
    ? "Unknown"
    : value === "yes"
      ? "Yes"
      : value === "no"
        ? "No"
        : value;
}
export function buildCompletedIntake(
  patientId: string,
  input: IntakeAnswers,
  version: number,
  submissionId: string,
  timestamp: string,
): CompletedIntake {
  const parsed = intakeSchema.parse(
    Object.assign(
      { familyCrcFirstDegree: null, familyCrcDiagnosisAge: null },
      input,
    ),
  );
  const answers = Object.fromEntries(
    fieldIds.map((id) => [id, isVisible(id, parsed) ? parsed[id] : null]),
  ) as IntakeAnswers;
  const reported = (value: string | null) => ({
    value,
    provenance: "PATIENT_REPORTED" as const,
  });
  const booleanFact = (id: FieldId) =>
    answers[id] === null ? null : answers[id] === "yes";
  const intakeFacts = intakeFactsSchema.parse({
    provenance: "PATIENT_REPORTED",
    ...Object.fromEntries(
      [
        "rectalBleeding",
        "bowelChange",
        "weightLoss",
        "colorectalCancer",
        "polyps",
        "ibd",
        "hereditaryCancerSyndrome",
        "serratedPolyposis",
        "familyCrc",
        "familyCrcFirstDegree",
        "familySyndrome",
        "colonoscopyNormal",
        "colonoscopyComplete",
        "colonoscopyAdequatePrep",
      ].map((id) => [id, booleanFact(id as FieldId)]),
    ),
    priorScreening: answers.priorScreening,
    familyCrcDiagnosisAge:
      answers.familyCrcDiagnosisAge === null
        ? null
        : Number(answers.familyCrcDiagnosisAge),
  });
  const missingInformation = fields
    .filter(
      (field) => isVisible(field.id, parsed) && answers[field.id] === null,
    )
    .map((field) => field.label);
  const hasExam = ["COLONOSCOPY", "OTHER"].includes(
    answers.priorScreening ?? "",
  );
  const exact = answers.examDatePrecision === "EXACT" ? answers.examDate : null;
  const approximate =
    answers.examDatePrecision === "APPROXIMATE"
      ? answers.examApproximateDate
      : null;
  if (hasExam && approximate)
    missingInformation.push("Previous examination date is approximate");
  const examinations = hasExam
    ? [
        previousExaminationSchema.parse({
          id: `${patientId}-exam-v${version}`,
          patientId,
          name:
            answers.priorScreening === "COLONOSCOPY"
              ? "Colonoscopy"
              : (answers.examName ?? "Unknown screening test"),
          performedAt: exact,
          datePrecision: exact
            ? "EXACT"
            : approximate
              ? "APPROXIMATE"
              : "UNKNOWN",
          approximateDate: approximate,
          result: reported(
            answers.priorScreening === "COLONOSCOPY"
              ? answers.colonoscopyNormal === null
                ? null
                : answers.colonoscopyNormal === "yes"
                  ? "Normal"
                  : "Abnormal"
              : answers.examResult,
          ),
          notes:
            "DEMONSTRATIVE — NOT CLINICALLY VALIDATED. Patient-reported; not a verified examination record.",
        }),
      ]
    : [];
  const history = (ids: FieldId[]) =>
    fields
      .filter((field) => ids.includes(field.id) && isVisible(field.id, parsed))
      .map((field) =>
        reported(
          answers[field.id] === null
            ? null
            : `${field.label}: ${answerLabel(answers[field.id])}`,
        ),
      );
  return completedIntakeSchema.parse({
    submissionId,
    synthetic: true,
    validation: "demonstrative",
    examinations,
    profile: {
      id: `${patientId}-profile-v${version}`,
      patientId,
      version,
      age: answers.age === null ? null : Number(answers.age),
      intakeFacts,
      personalHistory: history([
        "rectalBleeding",
        "bowelChange",
        "weightLoss",
        "colorectalCancer",
        "polyps",
        "ibd",
        "hereditaryCancerSyndrome",
        "serratedPolyposis",
        "historyDetails",
      ]),
      familyHistory: history([
        "familyCrc",
        "familyCrcFirstDegree",
        "familyCrcDiagnosisAge",
        "familySyndrome",
      ]),
      medications: [reported(answers.medications)],
      habits: history(["smoking", "activity"]),
      missingInformation,
      examinationIds: examinations.map((exam) => exam.id),
      updatedAt: timestamp,
    },
    intake: {
      id: `${patientId}-intake-v${version}`,
      patientId,
      profileVersion: version,
      completedAt: timestamp,
      answers: Object.fromEntries(
        fieldIds.map((id) => [id, reported(answers[id])]),
      ),
    },
  });
}
