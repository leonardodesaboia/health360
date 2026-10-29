import { z } from "zod";

export const fieldIds = [
  "age",
  "rectalBleeding",
  "bowelChange",
  "weightLoss",
  "colorectalCancer",
  "polyps",
  "ibd",
  "familyCrc",
  "familyCrcFirstDegree",
  "familyCrcDiagnosisAge",
  "familySyndrome",
  "historyDetails",
  "hereditaryCancerSyndrome",
  "serratedPolyposis",
  "medications",
  "smoking",
  "activity",
  "priorScreening",
  "examName",
  "examDatePrecision",
  "examDate",
  "examApproximateDate",
  "examResult",
  "colonoscopyNormal",
  "colonoscopyComplete",
  "colonoscopyAdequatePrep",
] as const;
export type FieldId = (typeof fieldIds)[number];
export const fields: {
  id: FieldId;
  label: string;
  kind: "age" | "choice" | "text" | "date";
  options?: [string, string][];
}[] = [
  { id: "age", label: "Age in the synthetic scenario", kind: "age" },
  { id: "rectalBleeding", label: "Rectal bleeding", kind: "choice" },
  { id: "bowelChange", label: "Change in bowel habits", kind: "choice" },
  { id: "weightLoss", label: "Unexplained weight loss", kind: "choice" },
  {
    id: "colorectalCancer",
    label: "Personal history of colorectal cancer",
    kind: "choice",
  },
  {
    id: "polyps",
    label: "Personal history of adenomatous polyps",
    kind: "choice",
  },
  {
    id: "ibd",
    label: "Personal history of inflammatory bowel disease",
    kind: "choice",
  },
  {
    id: "familyCrc",
    label: "Family history of colorectal cancer",
    kind: "choice",
  },
  {
    id: "familySyndrome",
    label: "Family history of Lynch syndrome or familial adenomatous polyposis",
    kind: "choice",
  },
  {
    id: "familyCrcFirstDegree",
    label: "Was a parent, sibling or child diagnosed with colorectal cancer?",
    kind: "choice",
  },
  {
    id: "familyCrcDiagnosisAge",
    label: "Age at diagnosis of the youngest affected parent, sibling or child",
    kind: "age",
  },
  {
    id: "historyDetails",
    label: "Details of the declared personal history (synthetic only)",
    kind: "text",
  },
  {
    id: "hereditaryCancerSyndrome",
    label: "Personal history of a hereditary colorectal cancer syndrome",
    kind: "choice",
  },
  {
    id: "serratedPolyposis",
    label: "Personal history of serrated polyposis syndrome",
    kind: "choice",
  },
  {
    id: "medications",
    label: "Current medications (enter None if none)",
    kind: "text",
  },
  { id: "smoking", label: "Currently smoking", kind: "choice" },
  { id: "activity", label: "Regular physical activity", kind: "choice" },
  {
    id: "priorScreening",
    label: "Previous colorectal screening",
    kind: "choice",
    options: [
      ["NEVER_SCREENED", "Never screened"],
      ["COLONOSCOPY", "Colonoscopy"],
      ["OTHER", "Other screening test"],
    ],
  },
  { id: "examName", label: "Previous screening test name", kind: "text" },
  {
    id: "examDatePrecision",
    label: "Previous examination date",
    kind: "choice",
    options: [
      ["EXACT", "I know the exact date"],
      ["APPROXIMATE", "I know the approximate year or month"],
    ],
  },
  { id: "examDate", label: "Exact examination date", kind: "date" },
  {
    id: "examApproximateDate",
    label: "Approximate examination date (YYYY or YYYY-MM)",
    kind: "text",
  },
  { id: "examResult", label: "Previous screening result", kind: "text" },
  {
    id: "colonoscopyNormal",
    label: "Colonoscopy result was normal",
    kind: "choice",
  },
  {
    id: "colonoscopyComplete",
    label: "Colonoscopy reached the cecum (complete examination)",
    kind: "choice",
  },
  {
    id: "colonoscopyAdequatePrep",
    label: "Colonoscopy bowel preparation was adequate",
    kind: "choice",
  },
];

export function isVisible(id: FieldId, answers: Partial<IntakeAnswers>) {
  if (id === "familyCrcFirstDegree") return answers.familyCrc === "yes";
  if (id === "familyCrcDiagnosisAge")
    return (
      answers.familyCrc === "yes" && answers.familyCrcFirstDegree === "yes"
    );
  if (id === "historyDetails")
    return [
      answers.colorectalCancer,
      answers.polyps,
      answers.ibd,
      answers.hereditaryCancerSyndrome,
      answers.serratedPolyposis,
    ].includes("yes");
  if (id.startsWith("colonoscopy"))
    return answers.priorScreening === "COLONOSCOPY";
  if (id === "examName" || id === "examResult")
    return answers.priorScreening === "OTHER";
  if (id.startsWith("exam")) {
    if (!["COLONOSCOPY", "OTHER"].includes(answers.priorScreening ?? ""))
      return false;
    if (id === "examDate") return answers.examDatePrecision === "EXACT";
    if (id === "examApproximateDate")
      return answers.examDatePrecision === "APPROXIMATE";
  }
  return true;
}
const historyIds: FieldId[] = [
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
  "familyCrcDiagnosisAge",
  "familySyndrome",
  "historyDetails",
  "medications",
];
export const steps: { title: string; fields: FieldId[] }[] = [
  { title: "Basic information", fields: ["age"] },
  { title: "Clinical history", fields: historyIds },
  { title: "Habits", fields: ["smoking", "activity"] },
  {
    title: "Previous exams",
    fields: [
      "priorScreening",
      "examName",
      "examDatePrecision",
      "examDate",
      "examApproximateDate",
      "examResult",
      "colonoscopyNormal",
      "colonoscopyComplete",
      "colonoscopyAdequatePrep",
    ],
  },
  { title: "Review answers", fields: [] },
];
export const answersSchema = z.record(
  z.enum(fieldIds),
  z.string().max(120).nullable(),
);
export type IntakeAnswers = z.infer<typeof answersSchema>;
export const initialAnswers: IntakeAnswers = Object.fromEntries(
  fieldIds.map((id) => [id, ""]),
) as IntakeAnswers;
export const intakeSchema = answersSchema.superRefine((answers, ctx) => {
  for (const field of fields) {
    if (!isVisible(field.id, answers)) continue;
    const value = answers[field.id];
    if (value === null) continue;
    const valid =
      field.kind === "age"
        ? /^\d{1,3}$/.test(value) && Number(value) <= 120
        : field.kind === "date"
          ? z.iso.date().safeParse(value).success &&
            value <= new Date().toISOString().slice(0, 10)
          : field.id === "examApproximateDate"
            ? /^\d{4}(-(?:0[1-9]|1[0-2]))?$/.test(value) &&
              value <= new Date().toISOString().slice(0, value.length)
            : field.options
              ? field.options.some(([option]) => option === value)
              : field.kind === "text"
                ? value.trim().length > 0
                : ["yes", "no"].includes(value);
    if (!valid)
      ctx.addIssue({
        code: "custom",
        path: [field.id],
        message:
          field.kind === "age"
            ? "Enter an age from 0 to 120, or select I don't know."
            : "Enter a valid answer, or choose I don't know.",
      });
  }
});
export const draftSchema = z.object({
  schemaVersion: z.literal(1),
  synthetic: z.literal(true),
  validation: z.literal("demonstrative"),
  patientId: z.string().min(1),
  revision: z.number().int().positive(),
  step: z
    .number()
    .int()
    .min(0)
    .max(steps.length - 1),
  answers: z.preprocess(
    (input) =>
      input && typeof input === "object" && !Array.isArray(input)
        ? { familyCrcFirstDegree: null, familyCrcDiagnosisAge: null, ...input }
        : input,
    answersSchema,
  ),
  updatedAt: z.iso.datetime(),
});
export type IntakeDraft = z.infer<typeof draftSchema>;
