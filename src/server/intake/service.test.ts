import { expect, it, vi } from "vitest";
import type { PrismaClient } from "../../generated/prisma/client";
const { transitionWorkflow } = vi.hoisted(() => ({
  transitionWorkflow: vi.fn(),
}));
vi.mock("../db/repository", () => ({
  inDatasetTransaction: async (
    _db: unknown,
    _id: string,
    work: (repo: unknown, tx: unknown) => Promise<void>,
  ) => work({}, {}),
}));
vi.mock("../workflow/state", () => ({
  getWorkflowStatus: async () => "ANALYSIS_FAILED",
  transitionWorkflow,
}));
import { startIntake } from "./service";
it("starts the existing intake transition when correcting a blocked analysis", async () => {
  await startIntake({} as PrismaClient, "dataset", "patient");
  expect(transitionWorkflow).toHaveBeenCalledWith(
    {},
    "dataset",
    expect.objectContaining({
      expectedFrom: "ANALYSIS_FAILED",
      to: "INTAKE_IN_PROGRESS",
      actor: "patient",
    }),
  );
});
