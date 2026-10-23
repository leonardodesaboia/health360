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
  "familySyndrome",
  "historyDetails",
] as const;
export type FieldId = (typeof fieldIds)[number];
export const fields: {
  id: FieldId;
  label: string;
  kind: "age" | "choice" | "text";
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
    id: "historyDetails",
    label: "Details of the declared personal history (synthetic only)",
    kind: "text",
  },
];
export function isVisible(id: FieldId, answers: Partial<IntakeAnswers>) {
  return (
    id !== "historyDetails" ||
    [answers.colorectalCancer, answers.polyps, answers.ibd].includes("yes")
  );
}
export const steps: { title: string; fields: FieldId[] }[] = [
  { title: "Basic information", fields: ["age"] },
  { title: "Clinical history", fields: fieldIds.filter((id) => id !== "age") },
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
            : "Choose Yes, No, or I don't know.",
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
  answers: answersSchema,
  updatedAt: z.iso.datetime(),
});
export type IntakeDraft = z.infer<typeof draftSchema>;
