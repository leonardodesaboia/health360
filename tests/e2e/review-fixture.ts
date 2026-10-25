// Synthetic contract fixtures only. Run in a child process with react-server conditions.
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createDatabase } from "../../src/server/db/client";
import {
  inDatasetTransaction,
  datasetRepository,
} from "../../src/server/db/repository";
import {
  transitionWorkflow,
  getWorkflowStatus,
} from "../../src/server/workflow/state";
import { demoDatasetId, demoCaseRecords } from "../../src/server/demo/records";
import {
  demoSessionCookie,
  demoCaseIdSchema,
} from "../../src/server/demo/contracts";
import { replaceDemoDataset } from "../../src/server/demo/store";
import { aiAnalysisSchema } from "../../src/features/patients/contracts";
import { analyzeSession } from "../../src/server/analysis/service";
import { analyze } from "../../src/server/ai/analyze";
import { MockProvider } from "../../src/server/ai/provider/mock";
import * as workflow from "../../src/server/workflow/state";
import { workspaceId } from "../../src/features/clinical-review/reader";

const mode = z
  .enum(["seed", "seed-real", "seed-blocked", "stale-profile", "cleanup"])
  .parse(process.argv[2]);
const datasetId = demoDatasetId(
  z.string().parse(process.env.REVIEW_TEST_TOKEN),
);
const caseId = demoCaseIdSchema.parse(
  process.env.REVIEW_TEST_CASE ?? "first-screening",
);
if (!process.env.TEST_DATABASE_URL)
  throw new Error(
    "TEST_DATABASE_URL must name a disposable database for physician e2e fixtures",
  );
const db = createDatabase(process.env.TEST_DATABASE_URL);
const now = "2026-10-23T12:34:56Z";
try {
  if (mode === "cleanup") {
    await db.dataset.deleteMany({ where: { id: datasetId } });
  } else if (mode === "seed-real") {
    await seedRealAnalysis();
  } else if (mode === "stale-profile") {
    await inDatasetTransaction(db, datasetId, async (repository, tx) => {
      const { patient } = demoCaseRecords(caseId);
      await getWorkflowStatus(tx, datasetId, patient.id);
      const profile = (await repository.list("profile"))
        .filter((p) => p.patientId === patient.id)
        .sort((a, b) => b.version - a.version)[0];
      await repository.append("profile", {
        ...profile,
        id: randomUUID(),
        version: profile.version + 1,
        age: null,
        updatedAt: now,
      });
    });
  } else {
    await replaceDemoDataset(db, datasetId, caseId);
    const { patient, profile } = demoCaseRecords(caseId);
    const context = (
      await datasetRepository(db, datasetId).list("context")
    ).find((item) => item.scenarioId === caseId);
    if (!context)
      throw new Error(
        "The demo fixture must reference the seeded clinical context",
      );
    const analysisId = randomUUID();
    const repeat = caseId === "repeat-screening";
    const proposal = {
      id: randomUUID(),
      analysisId,
      category: repeat ? "POSSIBLE_REDUNDANCY" : "PREVENTIVE_OPPORTUNITY",
      title: "Demonstrative review item",
      rationale:
        "Synthetic rendering fixture only; physician review is required.",
      ruleIds: [repeat ? "crc-routine-repeat" : "crc-screening-due"],
      evidenceIds: [repeat ? "usmstf-colonoscopy-2020" : "uspstf-crc-2021"],
      consideredData: ["Synthetic patient-reported profile"],
      uncertainties: [
        "Patient-reported data has not been clinically confirmed.",
      ],
      provenance: "AI_GENERATED",
    };
    const blocked = mode === "seed-blocked";
    const analysis = aiAnalysisSchema.parse({
      id: analysisId,
      version: 1,
      patientId: patient.id,
      profileVersion: profile.version,
      contextId: context.id,
      contextVersion: context.version,
      provider: "synthetic-test",
      model: "reader-fixture",
      promptVersion: 1,
      createdAt: now,
      summary:
        "This is a synthetic reader fixture; no live AI analysis was performed.",
      relevantInformation: ["Prepared synthetic scenario"],
      missingInformation: ["Clinical confirmation"],
      uncertainties: ["Demonstrative and not clinically validated"],
      reviewQuestions: [],
      proposals: blocked ? [] : [proposal],
      status: blocked ? "BLOCKED" : "PRELIMINARY",
    });
    await inDatasetTransaction(db, datasetId, async (repository, tx) => {
      const refs = { profileVersion: profile.version, analysisId: analysis.id };
      await transitionWorkflow(tx, datasetId, {
        patientId: patient.id,
        expectedFrom: "NOT_STARTED",
        to: "INTAKE_IN_PROGRESS",
        actor: "patient",
        refs,
      });
      await repository.append("intake", {
        id: randomUUID(),
        patientId: patient.id,
        profileVersion: profile.version,
        answers: {},
        completedAt: now,
      });
      await transitionWorkflow(tx, datasetId, {
        patientId: patient.id,
        expectedFrom: "INTAKE_IN_PROGRESS",
        to: "INTAKE_COMPLETED",
        actor: "patient",
        refs,
      });
      await transitionWorkflow(tx, datasetId, {
        patientId: patient.id,
        expectedFrom: "INTAKE_COMPLETED",
        to: "ANALYSIS_PENDING",
        actor: "system",
        refs,
      });
      await repository.append("analysis", analysis);
      await transitionWorkflow(tx, datasetId, {
        patientId: patient.id,
        expectedFrom: "ANALYSIS_PENDING",
        to: blocked ? "ANALYSIS_FAILED" : "MEDICAL_REVIEW_PENDING",
        actor: "system",
        refs,
      });
    });
    process.stdout.write(
      JSON.stringify({
        datasetId,
        workspaceId: workspaceId(analysis),
        cookieName: demoSessionCookie,
        patientName: patient.displayName,
        analysisTime: now,
      }),
    );
  }
} finally {
  await db.$disconnect();
}

/** Exercise the landed P0-07 producer; only the external model is deterministic. */
async function seedRealAnalysis() {
  if (caseId !== "first-screening")
    throw new Error("This reader integration uses the first-screening case");
  await replaceDemoDataset(db, datasetId, caseId);
  const { patient, profile } = demoCaseRecords(caseId);
  const profileVersion = profile.version + 1;
  await inDatasetTransaction(db, datasetId, async (repository, tx) => {
    await transitionWorkflow(tx, datasetId, {
      patientId: patient.id,
      expectedFrom: "NOT_STARTED",
      to: "INTAKE_IN_PROGRESS",
      actor: "patient",
    });
    await repository.append("profile", {
      ...profile,
      id: randomUUID(),
      version: profileVersion,
      updatedAt: now,
      intakeFacts: {
        provenance: "PATIENT_REPORTED",
        rectalBleeding: false,
        bowelChange: false,
        weightLoss: false,
        colorectalCancer: false,
        polyps: false,
        ibd: false,
        hereditaryCancerSyndrome: false,
        serratedPolyposis: false,
        familyCrc: false,
        familySyndrome: false,
        priorScreening: "NEVER_SCREENED",
        colonoscopyNormal: null,
        colonoscopyComplete: null,
        colonoscopyAdequatePrep: null,
      },
    });
    await repository.append("intake", {
      id: randomUUID(),
      patientId: patient.id,
      profileVersion,
      answers: {},
      completedAt: now,
    });
    await transitionWorkflow(tx, datasetId, {
      patientId: patient.id,
      expectedFrom: "INTAKE_IN_PROGRESS",
      to: "INTAKE_COMPLETED",
      actor: "patient",
      refs: { profileVersion },
    });
  });
  const result = await analyzeSession(
    db,
    { datasetId, patientId: patient.id, caseId },
    {
      workflow,
      audit: {
        provider: "mock",
        model: "reader-integration",
        promptVersion: 1,
        promptId: "reader-integration",
      },
      now: () => new Date(now),
      explain: (input) =>
        analyze(
          input,
          new MockProvider({
            ok: true,
            data: {
              summary:
                "This is a synthetic reader fixture; no live AI analysis was performed.",
              relevantInformation: [],
              missingInformation: [],
              uncertainties: [],
              reviewQuestions: [],
              proposals: input.context.allowedProposals.map((finding) => ({
                category: finding.category,
                title: "Demonstrative review item",
                rationale:
                  "Synthetic rendering fixture only; physician review is required.",
                ruleIds: [finding.ruleId],
                evidenceIds: finding.evidenceIds,
                consideredData: ["Supplied deterministic facts"],
                uncertainties: [],
              })),
            },
          }),
          1000,
        ),
    },
  );
  if (
    result.status !== "RECORDED" ||
    result.workflowStatus !== "MEDICAL_REVIEW_PENDING"
  )
    throw new Error(
      `The real analysis producer did not create a reviewable analysis: ${result.status}`,
    );
  const records = await datasetRepository(db, datasetId).list("analysis");
  const analysis = records.find((record) => record.id === result.analysisId);
  if (
    !analysis ||
    analysis.status !== "PRELIMINARY" ||
    !analysis.proposals.length ||
    analysis.profileVersion !== profileVersion
  )
    throw new Error(
      "Real producer records must include the current profile and proposals",
    );
  process.stdout.write(
    JSON.stringify({
      datasetId,
      workspaceId: workspaceId(analysis),
      cookieName: demoSessionCookie,
      patientName: patient.displayName,
      analysisTime: analysis.createdAt,
    }),
  );
}
