// Test-only CLI. It is never imported by application code or exposed as an endpoint.
import "dotenv/config";
import { strict as assert } from "node:assert";
import { z } from "zod";
import { createDatabase } from "../../../src/server/db/client";
import { datasetRepository } from "../../../src/server/db/repository";
import { demoDatasetId } from "../../../src/server/demo/records";
import { demoSessionTokenSchema } from "../../../src/server/demo/contracts";
import { loadDemoCase } from "../../../src/server/demo/store";
import * as workflow from "../../../src/server/workflow/state";
import { analyzeSession } from "../../../src/server/analysis/service";
import { analyze } from "../../../src/server/ai/analyze";
import { MockProvider } from "../../../src/server/ai/provider/mock";
import { analysisOutputSchema } from "../../../src/server/ai/schemas/analysis";
import type { LlmProvider } from "../../../src/server/ai/provider/types";

const mode = z
  .enum(["inspect", "fail-analysis", "cleanup"])
  .parse(process.argv[2]);
const token = demoSessionTokenSchema.parse(process.argv[3]);
if (
  !process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL
)
  throw new Error(
    "Acceptance tests require DATABASE_URL and TEST_DATABASE_URL to name the same disposable database",
  );
const db = createDatabase(process.env.TEST_DATABASE_URL);
const datasetId = demoDatasetId(token);
try {
  if (mode === "cleanup") {
    await db.dataset.deleteMany({ where: { id: datasetId } });
  } else {
    const session = await loadDemoCase(db, datasetId);
    if (!session)
      throw new Error("Selected synthetic acceptance session is missing");
    if (mode === "fail-analysis") {
      const variant = z
        .enum([
          "timeout",
          "api-error",
          "malformed",
          "unknown-evidence",
          "unsupported-category",
          "insufficient-support",
        ])
        .parse(process.argv[4]);
      const mock = new MockProvider();
      const provider: LlmProvider = {
        id: "mock",
        model: "acceptance-failure",
        async generate(request) {
          if (variant === "timeout") return { ok: false, reason: "timeout" };
          if (variant === "api-error")
            return { ok: false, reason: "api_error" };
          if (variant === "malformed")
            return { ok: true, data: { summary: "UNTRUSTED_RESPONSE_MARKER" } };
          const generated = await mock.generate(request);
          assert.equal(generated.ok, true);
          if (!generated.ok)
            throw new Error(
              "Valid deterministic output required before fault injection",
            );
          const data = analysisOutputSchema.parse(generated.data);
          assert.equal(data.proposals.length, 1);
          if (variant === "unknown-evidence")
            data.proposals[0].evidenceIds = ["unknown-evidence-test-only"];
          if (variant === "insufficient-support") data.proposals = [];
          return {
            ok: true,
            data:
              variant === "unsupported-category"
                ? {
                    ...data,
                    proposals: [
                      {
                        ...data.proposals[0],
                        category: "UNSUPPORTED_TEST_CATEGORY",
                      },
                    ],
                  }
                : data,
          };
        },
      };
      const result = await analyzeSession(
        db,
        { datasetId, patientId: session.patient.id, caseId: session.caseId },
        {
          workflow,
          audit: {
            provider: "mock",
            model: provider.model,
            promptId: "synthetic-analysis",
            promptVersion: 1,
          },
          explain: (input) => analyze(input, provider, 1000),
        },
      );
      assert.equal(result.status, "RECORDED");
      assert.ok(
        "workflowStatus" in result &&
          result.workflowStatus === "ANALYSIS_FAILED",
      );
    }
    const repo = datasetRepository(db, datasetId);
    const analyses = (await repo.list("analysis")).sort(
      (a, b) => a.version - b.version,
    );
    process.stdout.write(
      JSON.stringify({
        status: await workflow.getWorkflowStatus(
          db,
          datasetId,
          session.patient.id,
        ),
        profiles: (await repo.list("profile")).map(({ version, age }) => ({
          version,
          age,
        })),
        analyses: analyses.map(
          ({ status, failureReason, profileVersion, proposals }) => ({
            status,
            failureReason,
            profileVersion,
            proposalCount: proposals.length,
          }),
        ),
        reviews: (await repo.list("review")).length,
        plans: await repo.list("plan"),
        eventKinds: (await repo.list("event")).map(({ kind }) => kind),
      }),
    );
  }
} finally {
  await db.$disconnect();
}
