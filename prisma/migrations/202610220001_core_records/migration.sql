-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "datasetId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("datasetId","id")
);

-- CreateTable
CREATE TABLE "HealthProfile" (
    "datasetId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "HealthProfile_pkey" PRIMARY KEY ("datasetId","id")
);

-- CreateTable
CREATE TABLE "PreviousExamination" (
    "datasetId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "PreviousExamination_pkey" PRIMARY KEY ("datasetId","id")
);

-- CreateTable
CREATE TABLE "ProfileExamination" (
    "datasetId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "profileVersion" INTEGER NOT NULL,
    "examinationId" TEXT NOT NULL,

    CONSTRAINT "ProfileExamination_pkey" PRIMARY KEY ("datasetId","patientId","profileVersion","examinationId")
);

-- CreateTable
CREATE TABLE "IntakeResponse" (
    "datasetId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "profileVersion" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "IntakeResponse_pkey" PRIMARY KEY ("datasetId","id")
);

-- CreateTable
CREATE TABLE "ClinicalContext" (
    "datasetId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "ClinicalContext_pkey" PRIMARY KEY ("datasetId","id","version")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "datasetId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "profileVersion" INTEGER NOT NULL,
    "contextId" TEXT NOT NULL,
    "contextVersion" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("datasetId","id","version")
);

-- CreateTable
CREATE TABLE "RecommendationProposal" (
    "datasetId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "analysisVersion" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "RecommendationProposal_pkey" PRIMARY KEY ("datasetId","id","analysisVersion")
);

-- CreateTable
CREATE TABLE "MedicalReview" (
    "datasetId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "analysisId" TEXT NOT NULL,
    "analysisVersion" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "MedicalReview_pkey" PRIMARY KEY ("datasetId","id","version")
);

-- CreateTable
CREATE TABLE "PreventivePlan" (
    "datasetId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "profileVersion" INTEGER NOT NULL,
    "reviewId" TEXT NOT NULL,
    "reviewVersion" INTEGER NOT NULL,
    "previousPlanId" TEXT,
    "payload" JSONB NOT NULL,

    CONSTRAINT "PreventivePlan_pkey" PRIMARY KEY ("datasetId","id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "datasetId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("datasetId","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HealthProfile_datasetId_patientId_version_key" ON "HealthProfile"("datasetId", "patientId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PreviousExamination_datasetId_patientId_id_key" ON "PreviousExamination"("datasetId", "patientId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AIAnalysis_datasetId_patientId_version_key" ON "AIAnalysis"("datasetId", "patientId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "AIAnalysis_datasetId_patientId_id_version_key" ON "AIAnalysis"("datasetId", "patientId", "id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalReview_datasetId_patientId_id_version_key" ON "MedicalReview"("datasetId", "patientId", "id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PreventivePlan_datasetId_patientId_version_key" ON "PreventivePlan"("datasetId", "patientId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PreventivePlan_datasetId_patientId_id_key" ON "PreventivePlan"("datasetId", "patientId", "id");

-- CreateIndex
CREATE INDEX "TimelineEvent_datasetId_patientId_occurredAt_idx" ON "TimelineEvent"("datasetId", "patientId", "occurredAt");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProfile" ADD CONSTRAINT "HealthProfile_datasetId_patientId_fkey" FOREIGN KEY ("datasetId", "patientId") REFERENCES "Patient"("datasetId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreviousExamination" ADD CONSTRAINT "PreviousExamination_datasetId_patientId_fkey" FOREIGN KEY ("datasetId", "patientId") REFERENCES "Patient"("datasetId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileExamination" ADD CONSTRAINT "ProfileExamination_datasetId_patientId_profileVersion_fkey" FOREIGN KEY ("datasetId", "patientId", "profileVersion") REFERENCES "HealthProfile"("datasetId", "patientId", "version") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileExamination" ADD CONSTRAINT "ProfileExamination_datasetId_patientId_examinationId_fkey" FOREIGN KEY ("datasetId", "patientId", "examinationId") REFERENCES "PreviousExamination"("datasetId", "patientId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeResponse" ADD CONSTRAINT "IntakeResponse_datasetId_patientId_fkey" FOREIGN KEY ("datasetId", "patientId") REFERENCES "Patient"("datasetId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeResponse" ADD CONSTRAINT "IntakeResponse_datasetId_patientId_profileVersion_fkey" FOREIGN KEY ("datasetId", "patientId", "profileVersion") REFERENCES "HealthProfile"("datasetId", "patientId", "version") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalContext" ADD CONSTRAINT "ClinicalContext_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_datasetId_patientId_fkey" FOREIGN KEY ("datasetId", "patientId") REFERENCES "Patient"("datasetId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_datasetId_patientId_profileVersion_fkey" FOREIGN KEY ("datasetId", "patientId", "profileVersion") REFERENCES "HealthProfile"("datasetId", "patientId", "version") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_datasetId_contextId_contextVersion_fkey" FOREIGN KEY ("datasetId", "contextId", "contextVersion") REFERENCES "ClinicalContext"("datasetId", "id", "version") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationProposal" ADD CONSTRAINT "RecommendationProposal_datasetId_analysisId_analysisVersio_fkey" FOREIGN KEY ("datasetId", "analysisId", "analysisVersion") REFERENCES "AIAnalysis"("datasetId", "id", "version") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalReview" ADD CONSTRAINT "MedicalReview_datasetId_patientId_fkey" FOREIGN KEY ("datasetId", "patientId") REFERENCES "Patient"("datasetId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalReview" ADD CONSTRAINT "MedicalReview_datasetId_patientId_analysisId_analysisVersi_fkey" FOREIGN KEY ("datasetId", "patientId", "analysisId", "analysisVersion") REFERENCES "AIAnalysis"("datasetId", "patientId", "id", "version") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventivePlan" ADD CONSTRAINT "PreventivePlan_datasetId_patientId_fkey" FOREIGN KEY ("datasetId", "patientId") REFERENCES "Patient"("datasetId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventivePlan" ADD CONSTRAINT "PreventivePlan_datasetId_patientId_profileVersion_fkey" FOREIGN KEY ("datasetId", "patientId", "profileVersion") REFERENCES "HealthProfile"("datasetId", "patientId", "version") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventivePlan" ADD CONSTRAINT "PreventivePlan_datasetId_patientId_reviewId_reviewVersion_fkey" FOREIGN KEY ("datasetId", "patientId", "reviewId", "reviewVersion") REFERENCES "MedicalReview"("datasetId", "patientId", "id", "version") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventivePlan" ADD CONSTRAINT "PreventivePlan_datasetId_patientId_previousPlanId_fkey" FOREIGN KEY ("datasetId", "patientId", "previousPlanId") REFERENCES "PreventivePlan"("datasetId", "patientId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_datasetId_patientId_fkey" FOREIGN KEY ("datasetId", "patientId") REFERENCES "Patient"("datasetId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain payloads retain the public Zod contracts. Relational metadata must agree.
ALTER TABLE "Patient" ADD CONSTRAINT "synthetic_only" CHECK (payload->>'synthetic' = 'true' AND payload->>'id' = id);
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['HealthProfile','PreviousExamination','IntakeResponse','AIAnalysis','MedicalReview','PreventivePlan','TimelineEvent'] LOOP
    EXECUTE format('ALTER TABLE %I ADD CHECK (payload->>''id'' = id AND payload->>''patientId'' = "patientId")', table_name);
  END LOOP;
  FOREACH table_name IN ARRAY ARRAY['HealthProfile','ClinicalContext','AIAnalysis','MedicalReview','PreventivePlan'] LOOP
    EXECUTE format('ALTER TABLE %I ADD CHECK (version > 0 AND (payload->>''version'')::integer = version)', table_name);
  END LOOP;
END $$;

CREATE FUNCTION reject_historical_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Only an explicit dataset deletion may cascade through historical records.
  IF TG_OP = 'DELETE' AND NOT EXISTS (SELECT 1 FROM "Dataset" WHERE id = OLD."datasetId") THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Historical records are append-only' USING ERRCODE = '23514';
END $$;
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['Patient','HealthProfile','PreviousExamination','ProfileExamination','IntakeResponse','ClinicalContext','AIAnalysis','RecommendationProposal','MedicalReview','PreventivePlan','TimelineEvent'] LOOP
    EXECUTE format('CREATE TRIGGER immutable_record BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION reject_historical_mutation()', table_name);
  END LOOP;
END $$;

-- Timeline references are polymorphic in the domain contract; validate them at insertion.
CREATE FUNCTION validate_timeline_reference() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_table text; found boolean;
BEGIN
  target_table := CASE NEW.payload->>'kind'
    WHEN 'PROFILE_UPDATED' THEN 'HealthProfile'
    WHEN 'INTAKE_COMPLETED' THEN 'IntakeResponse'
    WHEN 'ANALYSIS_CREATED' THEN 'AIAnalysis'
    WHEN 'REVIEW_COMPLETED' THEN 'MedicalReview'
    WHEN 'PLAN_PUBLISHED' THEN 'PreventivePlan' END;
  IF target_table IS NULL THEN RAISE EXCEPTION 'Unsupported timeline kind'; END IF;
  IF target_table = 'IntakeResponse' THEN
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE "datasetId" = $1 AND "patientId" = $2 AND id = $3 AND "profileVersion" = $4)', target_table)
      INTO found USING NEW."datasetId", NEW."patientId", NEW.payload->>'entityId', (NEW.payload->>'entityVersion')::integer;
  ELSE
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE "datasetId" = $1 AND "patientId" = $2 AND id = $3 AND version = $4)', target_table)
      INTO found USING NEW."datasetId", NEW."patientId", NEW.payload->>'entityId', (NEW.payload->>'entityVersion')::integer;
  END IF;
  IF NOT found THEN RAISE EXCEPTION 'Missing timeline entity version' USING ERRCODE = '23503'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER timeline_reference BEFORE INSERT ON "TimelineEvent" FOR EACH ROW EXECUTE FUNCTION validate_timeline_reference();
