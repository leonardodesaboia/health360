-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "datasetId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("datasetId","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTransition_datasetId_patientId_version_key" ON "WorkflowTransition"("datasetId", "patientId", "version");

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_datasetId_patientId_fkey" FOREIGN KEY ("datasetId", "patientId") REFERENCES "Patient"("datasetId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowTransition" ADD CHECK (
  version > 0 AND (payload->>'version')::integer = version
  AND payload->>'id' = id AND payload->>'patientId' = "patientId"
);
CREATE TRIGGER immutable_record BEFORE UPDATE OR DELETE ON "WorkflowTransition"
  FOR EACH ROW EXECUTE FUNCTION reject_historical_mutation();
