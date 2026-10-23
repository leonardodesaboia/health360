import "server-only";
import type { PrismaClient } from "../../generated/prisma/client";
import { datasetRepository } from "./repository";
import { seedRecords } from "./records";

export async function seedDataset(db: PrismaClient, datasetId: string) {
  await db.$transaction(async (tx) => {
    // Serialize repeat seed requests; parameters never become SQL text.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${datasetId}))`;
    if (await tx.dataset.findUnique({ where: { id: datasetId } })) return;
    await tx.dataset.create({ data: { id: datasetId } });
    const repository = datasetRepository(tx, datasetId);
    for (const patient of seedRecords.patient)
      await repository.append("patient", patient);
    for (const examination of seedRecords.examination)
      await repository.append("examination", examination);
    for (const profile of seedRecords.profile)
      await repository.append("profile", profile);
    for (const context of seedRecords.context)
      await repository.append("context", context);
    for (const analysis of seedRecords.analysis)
      await repository.append("analysis", analysis);
  });
}
