import "server-only";
import {
  DEMONSTRATIVE_LABEL,
  screeningInputSchema,
  type RuleResult,
  type RuleStatus,
} from "./contracts";
import { evidenceSupportsRule, loadClinicalContext } from "./context";

const limitations = [
  "Preliminary synthetic demonstration; physician review and explicit finalization are mandatory.",
  "Routine screening only. Symptoms, increased risk, other tests and surveillance require individual assessment.",
  "A recent test alone does not establish redundancy. Patient-reported examination details require physician verification.",
];

/** Calendar anniversary, clamped to February 28 when the target year is not leap. */
function anniversary(date: string, years: number): string {
  const year = Number(date.slice(0, 4)) + years;
  const suffix = date.slice(4);
  return `${year}${suffix === "-02-29" && new Date(`${year}-02-29`).getUTCMonth() !== 1 ? "-02-28" : suffix}`;
}

export function evaluateScreening(input: unknown): RuleResult {
  const result: RuleResult = {
    validation: "demonstrative",
    label: DEMONSTRATIVE_LABEL,
    provenance: "RULE_GENERATED",
    requiresPhysicianReview: true,
    mayPublish: false,
    profileVersion: null,
    contextVersion: null,
    status: "BLOCKED",
    reason: "Invalid screening input",
    missingFields: [],
    consideredData: [],
    limitations: [...limitations],
    findings: [],
  };
  const finish = (status: RuleStatus, reason: string): RuleResult => ({
    ...result,
    status,
    reason,
  });
  const parsed = screeningInputSchema.safeParse(input);
  if (!parsed.success) return result;
  const { profile, examinations, facts, asOf, scenarioId, contextVersion } =
    parsed.data;
  result.profileVersion = profile.version;
  let context;
  try {
    context = loadClinicalContext(scenarioId, contextVersion);
  } catch {
    return finish("BLOCKED", "Unsupported scenario or context version");
  }
  result.contextVersion = context.version;
  const familyHistoryScenario = scenarioId === "family-history-screening";
  const [prevention, redundancy] = context.rules;
  if (
    !prevention ||
    (!familyHistoryScenario && !redundancy) ||
    !context.rules.every((rule) => evidenceSupportsRule(context, rule))
  )
    return finish("BLOCKED", "Missing or unsupported evidence");
  if (profile.updatedAt.slice(0, 10) > asOf)
    return finish(
      "BLOCKED",
      "Profile timestamp is later than the evaluation date",
    );

  result.consideredData = [
    `Age: ${profile.age ?? "unknown"}`,
    ...Object.entries(facts).map(
      ([key, value]) => `${key}: ${value ?? "unknown"}`,
    ),
    ...examinations.map(
      (exam) =>
        `Examination: ${exam.name}; date: ${exam.performedAt ?? "unknown"}; result: ${exam.result.value ?? "unknown"}`,
    ),
  ];
  const linkedIds = new Set(profile.examinationIds);
  if (
    linkedIds.size !== profile.examinationIds.length ||
    examinations.length !== linkedIds.size ||
    new Set(examinations.map((exam) => exam.id)).size !== examinations.length ||
    examinations.some(
      (exam) =>
        exam.patientId !== profile.patientId ||
        !linkedIds.has(exam.id) ||
        (exam.performedAt !== null && exam.performedAt > asOf),
    )
  )
    return finish(
      "BLOCKED",
      "Unlinked, duplicate, cross-patient or future examination",
    );
  if (
    facts.priorScreening === "NEVER_SCREENED" &&
    (examinations.length > 0 ||
      [facts.normal, facts.complete, facts.adequatePreparation].some(
        (value) => value !== null,
      ))
  )
    return finish("BLOCKED", "Screening history contradicts examination facts");
  if (familyHistoryScenario) {
    result.limitations = [
      "Preliminary synthetic demonstration; physician review and explicit finalization are mandatory.",
      "Restricted to never-screened, asymptomatic people reporting first-degree colorectal cancer before age 60; syndromes, other family-history patterns and surveillance require individual assessment.",
      "Patient-reported family history requires physician verification. The 2017 source describes a weak recommendation with low-quality evidence; this demonstration is not clinical validation.",
    ];
    if (
      facts.symptoms === true ||
      facts.personalRiskHistory === true ||
      facts.familySyndrome === true ||
      facts.familyRiskHistory === false ||
      facts.familyCrc === false ||
      facts.familyCrcFirstDegree === false ||
      (profile.age !== null && profile.age > prevention.maxAge) ||
      (facts.priorScreening !== null &&
        facts.priorScreening !== "NEVER_SCREENED")
    )
      return finish(
        "OUT_OF_SCOPE",
        "Restricted family-history early-start criteria do not apply",
      );
    if (profile.age === null) result.missingFields.push("profile.age");
    for (const field of [
      "symptoms",
      "personalRiskHistory",
      "familyCrc",
      "familySyndrome",
      "familyCrcFirstDegree",
      "familyCrcDiagnosisAge",
      "priorScreening",
    ] as const)
      if (facts[field] === null || facts[field] === undefined)
        result.missingFields.push(`facts.${field}`);
    result.missingFields.push(
      ...profile.missingInformation.map(
        (field) => `profile.missingInformation:${field}`,
      ),
    );
    if (result.missingFields.length)
      return finish(
        "NEEDS_CLARIFICATION",
        "Required family-history screening facts remain unknown",
      );
    const diagnosisAge = facts.familyCrcDiagnosisAge!;
    if (
      !prevention.relativeDiagnosisBeforeAge ||
      !prevention.yearsBeforeDiagnosis
    )
      return finish("BLOCKED", "Missing family-history rule parameters");
    const startAge = Math.min(
      prevention.minAge,
      diagnosisAge - prevention.yearsBeforeDiagnosis,
    );
    if (
      diagnosisAge >= prevention.relativeDiagnosisBeforeAge ||
      profile.age! < startAge
    )
      return finish(
        "OUT_OF_SCOPE",
        "Restricted family-history early-start criteria do not apply",
      );
    result.findings.push({
      category: prevention.category,
      ruleId: prevention.id,
      ruleVersion: prevention.version,
      evidenceIds: [...prevention.evidenceIds],
      evidenceVersion: prevention.evidenceVersion,
      rationale: `Discuss starting colorectal screening by colonoscopy now because a parent, sibling or child was diagnosed with colorectal cancer at age ${diagnosisAge}. The 2017 USMSTF family-history criterion starts at age ${startAge} (age 40 or 10 years before the youngest diagnosis, whichever is earlier), with a ${prevention.intervalYears}-year colonoscopy interval. Eligibility here is based on first-degree family history, not the age-45 average-risk criterion. Verify the family history and individual circumstances before deciding.`,
    });
    return finish(
      "READY_FOR_REVIEW",
      "Preliminary deterministic finding awaiting physician review",
    );
  }
  if (
    facts.symptoms === true ||
    facts.personalRiskHistory === true ||
    facts.familyRiskHistory === true ||
    (profile.age !== null &&
      (profile.age < prevention.minAge || profile.age > prevention.maxAge)) ||
    facts.priorScreening === "OTHER"
  )
    return finish(
      "OUT_OF_SCOPE",
      "Routine average-risk screening criteria do not apply",
    );
  if (profile.age === null) result.missingFields.push("profile.age");
  for (const field of [
    "symptoms",
    "personalRiskHistory",
    "familyRiskHistory",
    "priorScreening",
  ] as const)
    if (facts[field] === null) result.missingFields.push(`facts.${field}`);
  result.missingFields.push(
    ...profile.missingInformation.map(
      (field) => `profile.missingInformation:${field}`,
    ),
  );

  let rule = prevention;
  let rationale =
    "Discuss age-appropriate colorectal screening options; no prior screening is reported.";
  if (facts.priorScreening === "COLONOSCOPY") {
    if (examinations.length !== 1 || examinations[0].name !== "Colonoscopy")
      return finish(
        "BLOCKED",
        "The restricted rule requires exactly one linked colonoscopy",
      );
    const exam = examinations[0];
    if (
      [facts.normal, facts.complete, facts.adequatePreparation].includes(false)
    )
      return finish(
        "OUT_OF_SCOPE",
        "Abnormal or incomplete examination, or inadequate preparation",
      );
    if (exam.result.value !== null && exam.result.value !== "Normal")
      return finish(
        "BLOCKED",
        "Examination result contradicts or exceeds the restricted normal-result vocabulary",
      );
    for (const field of ["normal", "complete", "adequatePreparation"] as const)
      if (facts[field] === null) result.missingFields.push(`facts.${field}`);
    if (exam.performedAt === null)
      result.missingFields.push("examinations.performedAt");
    if (exam.result.value === null)
      result.missingFields.push("examinations.result");
    if (
      exam.performedAt !== null &&
      asOf < anniversary(exam.performedAt, redundancy.intervalYears)
    ) {
      rule = redundancy;
      rationale =
        "A routine repeat colonoscopy may be redundant within the ten-year interval after a reported normal complete adequately prepared examination; verify the report and indication.";
    } else
      rationale =
        "The reported prior normal colonoscopy has reached the ten-year screening interval; discuss screening options after verifying the report.";
  }
  if (result.missingFields.length > 0)
    return finish(
      "NEEDS_CLARIFICATION",
      "Required screening facts remain unknown",
    );
  result.findings.push({
    category: rule.category,
    ruleId: rule.id,
    ruleVersion: rule.version,
    evidenceIds: [...rule.evidenceIds],
    evidenceVersion: rule.evidenceVersion,
    rationale,
  });
  return finish(
    "READY_FOR_REVIEW",
    "Preliminary deterministic finding awaiting physician review",
  );
}
