import { z } from "zod";
import {
  fields,
  intakeSchema,
  type FieldId,
  type IntakeAnswers,
} from "../health-intake/contracts";

const paths: Record<string, FieldId[]> = {
  "profile.age": ["age"],
  "facts.symptoms": ["rectalBleeding", "bowelChange", "weightLoss"],
  "facts.personalRiskHistory": [
    "colorectalCancer",
    "polyps",
    "ibd",
    "hereditaryCancerSyndrome",
    "serratedPolyposis",
  ],
  "facts.familyRiskHistory": ["familyCrc", "familySyndrome"],
  "facts.familyCrc": ["familyCrc"],
  "facts.familySyndrome": ["familySyndrome"],
  "facts.familyCrcFirstDegree": ["familyCrcFirstDegree"],
  "facts.familyCrcDiagnosisAge": ["familyCrcDiagnosisAge"],
  "facts.priorScreening": ["priorScreening"],
  "facts.normal": ["colonoscopyNormal"],
  "facts.complete": ["colonoscopyComplete"],
  "facts.adequatePreparation": ["colonoscopyAdequatePrep"],
  "examinations.performedAt": ["examDate"],
};
const prompts: Partial<Record<FieldId, string>> = {
  age: "How old are you in this synthetic scenario?",
  rectalBleeding: "Have you noticed rectal bleeding?",
  bowelChange: "Have you noticed a change in bowel habits?",
  weightLoss: "Have you had unexplained weight loss?",
  colorectalCancer: "Have you had colorectal cancer?",
  polyps: "Have you had adenomatous polyps?",
  ibd: "Have you had inflammatory bowel disease?",
  hereditaryCancerSyndrome:
    "Have you had a hereditary colorectal cancer syndrome?",
  serratedPolyposis: "Have you had serrated polyposis syndrome?",
  familyCrc: "Has anyone in your family had colorectal cancer?",
  familyCrcFirstDegree:
    "Was a parent, sibling or child diagnosed with colorectal cancer?",
  familyCrcDiagnosisAge:
    "How old was the youngest affected parent, sibling or child at diagnosis?",
  familySyndrome:
    "Has anyone in your family had Lynch syndrome or familial adenomatous polyposis?",
  priorScreening: "What colorectal screening have you had before?",
  colonoscopyNormal: "Was your colonoscopy result normal?",
  colonoscopyComplete:
    "Did your colonoscopy reach the cecum (a complete examination)?",
  colonoscopyAdequatePrep:
    "Was your bowel preparation adequate for the colonoscopy?",
  examDate: "On what exact date was your previous screening examination?",
  examResult: "What was the result of your previous screening examination?",
  medications: "What medications do you currently take? Enter None if none.",
  smoking: "Do you currently smoke?",
  activity: "Do you get regular physical activity?",
  historyDetails:
    "What details can you share about your declared personal history?",
  examName: "What was the name of your previous screening test?",
};
export type ClarificationQuestion = (typeof fields)[number];

/** Only application-authored field mappings are accepted; arbitrary model text is not a question. */
export function selectQuestions(missing: string[], answers: IntakeAnswers) {
  const ids = new Set<FieldId>();
  const unsupported: string[] = [];
  for (const path of missing) {
    let mapped = Object.hasOwn(paths, path) ? paths[path] : undefined;
    if (path === "examinations.result")
      mapped = [
        answers.priorScreening === "COLONOSCOPY"
          ? "colonoscopyNormal"
          : "examResult",
      ];
    if (path.startsWith("profile.missingInformation:")) {
      const label = path.slice("profile.missingInformation:".length);
      const field = fields.find((f) => f.label === label);
      if (field) mapped = [field.id];
      if (label === "Previous examination date is approximate")
        mapped = ["examDate"];
    }
    if (!mapped) {
      unsupported.push(path);
      continue;
    }
    const aggregate = [
      "facts.symptoms",
      "facts.personalRiskHistory",
      "facts.familyRiskHistory",
    ].includes(path);
    for (const field of mapped) {
      if (aggregate && answers[field] !== null && answers[field] !== "")
        continue;
      ids.add(
        field === "examDatePrecision" || field === "examApproximateDate"
          ? "examDate"
          : field,
      );
    }
  }
  return {
    questions: [...ids].map((id) => {
      const definition = fields.find((f) => f.id === id)!;
      return {
        ...definition,
        label: prompts[id] ?? `What is your ${definition.label.toLowerCase()}?`,
      };
    }),
    unsupported,
  };
}

export function applyAnswers(
  current: IntakeAnswers,
  missing: string[],
  input: unknown,
): IntakeAnswers {
  const { questions, unsupported } = selectQuestions(missing, current);
  if (unsupported.length || !questions.length)
    throw new Error("Unsupported clarification request");
  return applyRequestedAnswers(current, questions, input);
}

export function applyRequestedAnswers(
  current: IntakeAnswers,
  questions: ClarificationQuestion[],
  input: unknown,
): IntakeAnswers {
  const patch = z
    .record(z.string(), z.string().max(120).nullable())
    .parse(input);
  if (
    Object.keys(patch).length !== questions.length ||
    questions.some((q) => !(q.id in patch)) ||
    Object.keys(patch).some((id) => !questions.some((q) => q.id === id))
  )
    throw new Error("Answer only the requested fields");
  // A physician may target a conditional field that the full intake currently hides.
  // Validate the explicitly requested input even when normal intake visibility skips it.
  for (const question of questions) {
    const value = patch[question.id];
    if (value === null) continue;
    const valid = question.options
      ? question.options.some(([option]) => option === value)
      : question.kind === "choice"
        ? ["yes", "no"].includes(value)
        : question.kind === "age"
          ? /^\d{1,3}$/.test(value) && Number(value) <= 120
          : question.kind === "date"
            ? z.iso.date().safeParse(value).success &&
              value <= new Date().toISOString().slice(0, 10)
            : question.id === "examApproximateDate"
              ? /^\d{4}(-(?:0[1-9]|1[0-2]))?$/.test(value) &&
                value <= new Date().toISOString().slice(0, value.length)
              : value.trim().length > 0;
    if (!valid) throw new Error("Invalid answer for the requested field");
  }
  const next = { ...current, ...patch };
  if ("examDate" in patch) {
    if (patch.examDate !== null) {
      next.examDatePrecision = "EXACT";
      next.examApproximateDate = null;
    } else if (next.examDatePrecision !== "APPROXIMATE")
      next.examDatePrecision = null;
  }
  return intakeSchema.parse(next);
}
