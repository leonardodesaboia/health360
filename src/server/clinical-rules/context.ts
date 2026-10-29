import "server-only";
import {
  demoContextSchema,
  type DemoContext,
  type DemoRule,
} from "./contracts";

export const scenarioIds = [
  "first-screening",
  "repeat-screening",
  "family-history-screening",
] as const;
const evidence = [
  {
    id: "uspstf-crc-2021",
    version: 1,
    issuer: "US Preventive Services Task Force",
    title: "Colorectal Cancer: Screening — Clinician Summary",
    year: 2021,
    sourceUrl:
      "https://www.uspreventiveservicestaskforce.org/uspstf/document/ClinicalSummaryFinal/colorectal-cancer-screening",
    accessedAt: "2026-10-22",
    evidenceStatus: "public_source",
    validation: "demonstrative",
    medicallyReviewed: false,
  },
  {
    id: "usmstf-colonoscopy-2020",
    version: 1,
    issuer: "US Multi-Society Task Force on Colorectal Cancer",
    title:
      "Recommendations for Follow-Up After Colonoscopy and Polypectomy: A Consensus Update",
    year: 2020,
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7393611/",
    accessedAt: "2026-10-22",
    evidenceStatus: "public_source",
    validation: "demonstrative",
    medicallyReviewed: false,
  },
];

export function loadClinicalContext(
  scenarioId: string,
  version: number,
): DemoContext {
  if (!scenarioIds.some((id) => id === scenarioId) || version !== 1)
    throw new Error("Unsupported scenario or context version");
  if (scenarioId === "family-history-screening") {
    const source = {
      id: "usmstf-crc-family-history-2017",
      version: 1,
      issuer:
        "US Multi-Society Task Force on Colorectal Cancer (ACG, AGA, ASGE)",
      title:
        "Colorectal cancer screening: Recommendations for physicians and patients from the U.S. Multi-Society Task Force on Colorectal Cancer",
      year: 2017,
      sourceUrl:
        "https://www.asge.org/home/resources/publications/guidelines/colorectal-cancer-screening-recommendations-for-physicians-and-patients-from-the-u.s.-multi-society-task-force-on-colorectal-cancer",
      accessedAt: "2026-10-29",
      evidenceStatus: "public_source",
      validation: "demonstrative",
      medicallyReviewed: false,
    };
    const rule = {
      id: "crc-family-history-early-start",
      version: 1,
      validation: "demonstrative",
      category: "PREVENTIVE_OPPORTUNITY",
      evidenceIds: [source.id],
      evidenceVersion: 1,
      minAge: 40,
      maxAge: 75,
      intervalYears: 5,
      relativeDiagnosisBeforeAge: 60,
      yearsBeforeDiagnosis: 10,
    };
    return demoContextSchema.parse({
      id: "crc-family-history-demo",
      version,
      scenarioId,
      demonstrative: true,
      validation: "demonstrative",
      label: "DEMONSTRATIVE — NOT CLINICALLY VALIDATED",
      evidence: [source],
      rules: [rule],
      ruleIds: [rule.id],
    });
  }
  const rules = [
    {
      id: "crc-screening-due",
      category: "PREVENTIVE_OPPORTUNITY",
      evidenceIds: [evidence[0].id],
    },
    {
      id: "crc-routine-repeat",
      category: "POSSIBLE_REDUNDANCY",
      evidenceIds: [evidence[1].id],
    },
  ].map((rule) => ({
    ...rule,
    version: 1,
    validation: "demonstrative",
    evidenceVersion: 1,
    minAge: 45,
    maxAge: 75,
    intervalYears: 10,
  }));
  return demoContextSchema.parse({
    id: "crc-screening-demo",
    version,
    scenarioId,
    demonstrative: true,
    validation: "demonstrative",
    label: "DEMONSTRATIVE — NOT CLINICALLY VALIDATED",
    evidence,
    rules,
    ruleIds: rules.map((rule) => rule.id),
  });
}

export function evidenceSupportsRule(
  context: DemoContext,
  rule: DemoRule,
): boolean {
  return (
    rule.evidenceIds.length > 0 &&
    rule.evidenceIds.every((id) => {
      const source = context.evidence.find((item) => item.id === id);
      return (
        source?.evidenceStatus === "public_source" &&
        source.sourceUrl !== null &&
        source.version === rule.evidenceVersion
      );
    })
  );
}
