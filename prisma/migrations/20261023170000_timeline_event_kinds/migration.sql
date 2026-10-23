-- Additive audit kinds. Preserve existing mappings and dataset/patient/version checks.
CREATE OR REPLACE FUNCTION validate_timeline_reference() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_table text; found boolean;
BEGIN
  target_table := CASE NEW.payload->>'kind'
    WHEN 'PROFILE_UPDATED' THEN 'HealthProfile'
    WHEN 'INTAKE_COMPLETED' THEN 'IntakeResponse'
    WHEN 'ANALYSIS_CREATED' THEN 'AIAnalysis'
    WHEN 'REVIEW_COMPLETED' THEN 'MedicalReview'
    WHEN 'REVIEW_UPDATED' THEN 'MedicalReview'
    WHEN 'REVIEW_CLARIFICATION_REQUESTED' THEN 'MedicalReview'
    WHEN 'ANALYSIS_FAILED' THEN 'AIAnalysis'
    WHEN 'CLARIFICATION_REQUESTED' THEN 'AIAnalysis'
    WHEN 'CLARIFICATION_ANSWERED' THEN 'HealthProfile'
    WHEN 'REASSESSMENT_REQUESTED' THEN 'HealthProfile'
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
