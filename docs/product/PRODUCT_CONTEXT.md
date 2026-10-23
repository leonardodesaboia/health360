# HEALTH360 — APPLICATION CONTEXT, MVP FEATURES AND FLOWS

(English translation of the original user prompt, preserving its full requirements. This describes FUTURE work: record it as product context and backlog, rather than implementing it all at once. The assigned task defines scope. ADR0004 supersedes the original interface-language requirement.)

## 1. Health360 overview

Health360 is a Brazilian healthtech developing a clinical intelligence platform for personalized, continuous preventive medicine based on scientific evidence.

The aim is to transform traditional checkups, often organized as standardized test packages, into an individualized prevention process followed over time.

Health360 seeks to help physicians and patients understand:

- Which preventive opportunities are relevant to each person.
- Which evaluations should be considered.
- Which tests may be redundant or unnecessary.
- Which information needs clarification.
- Which actions need follow-up.
- How the preventive plan should evolve over time.

The central product principle is:

"Better decisions, not more tests."

The platform combines structured health intake, clinical history, artificial intelligence, scientific evidence, physician review and longitudinal follow-up.

Health360 does not seek to replace physicians. AI serves as a support tool, while clinical decisions remain the professional's responsibility.

---

# 2. MVP objective

Build a working web application that demonstrates the main Health360 cycle.

The MVP will be developed on a short schedule and presented at the international HISIC 2026 competition.

The product requirements do not imply that functional modules or clinical validation already exist.

The prototype must initially operate with synthetic data, fictional patients and demonstration scenarios.

The objective is to demonstrate technical feasibility and the intended experience, rather than clinical efficacy.

The complete flow will be:

Patient completes health history → System organizes information → AI analyzes the supplied context → AI prepares proposals for review → Physician evaluates and makes decisions → Patient receives the reviewed plan → System preserves history → New data enables reassessment.

All main stages must work end to end.

Avoid purely visual features that produce no real effect in the application.

---

# 3. Artificial intelligence strategy — IMPORTANT

Health360 will NOT develop proprietary AI for this MVP.

Do not create, train, fine-tune or host custom models.

Do not implement machine learning pipelines, proprietary predictive models, multiagent systems, knowledge graphs or sophisticated optimization mechanisms.

The platform will use an established language model, such as a GPT model, accessed through an API.

The specific model must be configurable so it can be replaced without significant application changes.

The solution's intelligence will come from combining:

1. Structured patient information.
2. Prepared clinical context.
3. Selected scientific evidence.
4. Specific behavioral instructions.
5. Explicit rules and operating limits.
6. Structured model responses.
7. Mandatory physician supervision.

## 3.1. Integration behavior

The backend must prepare the information sent to the model.

A request may contain:

### System instructions

These define:

- The AI's role as a clinical support assistant.
- Its responsibilities.
- Analysis boundaries.
- Behavior when information is insufficient.
- The obligation to acknowledge uncertainty.
- The prohibition on inventing clinical information.
- The requirement to use only supplied evidence to support proposals.

### Clinical context

A small set of documents and information selected by the medical team, containing:

- Clinical guidelines relevant to the scope.
- Preventive criteria.
- Information about indications and contraindications.
- Eligibility criteria.
- Situations involving possible redundancy.
- Limitations and uncertainties.

This context must be versioned and traceable.

The MVP does not require a complete RAG system or vector database.

Context may be maintained in structured files or simple records loaded by the backend according to the scenario.

### Patient data

Information collected through health intake:

- Age.
- Clinically relevant information.
- Personal history.
- Family history.
- Medications.
- Habits.
- Previous examinations.
- Missing information.

Send only the data required for each analysis.

### Response contract

The AI must return a standardized structure containing:

- Case summary.
- Relevant findings.
- Missing information.
- Possible preventive opportunities.
- Possibly redundant tests.
- Rationales based on the supplied context.
- References to the supplied evidence.
- Uncertainties and limitations.
- Questions for physician review.

Use Structured Outputs or an equivalent mechanism, with backend schema validation.

---

# 4. AI rules and safety

The model may help interpret and organize information, but must not autonomously authorize medical decisions.

Do not rely exclusively on textual instructions to enforce clinical restrictions.

Implement a simple backend validation layer responsible for:

- Validating response format.
- Checking evidence identifiers.
- Preventing nonexistent references.
- Rejecting unsupported categories.
- Detecting missing required information.
- Blocking automatic publication of proposals.
- Handling invalid responses or API failures.
- Ensuring physician review before making the plan available.

Use only restricted, predefined clinical scenarios for the prototype.

Document and test the expected scenario behavior.

The LLM must not autonomously expand clinical scope or turn its own conclusions into final recommendations.

Critical eligibility, contraindication and blocking rules must be controlled by the application, even through simple logic, rather than by the prompt alone.

The initial evidence and rules remain demonstrative until formal medical review.

The system must recognize when it lacks sufficient information.

---

# 5. Application users

The MVP will have two integrated environments.

## 5.1. Patient

Patients use the platform to provide information, follow their evaluation and view their preventive plan.

Features:

- Access the patient environment.
- Start or continue health intake.
- Provide personal and family history.
- Record medications and habits.
- Report previous examinations.
- Review and edit answers.
- Submit information for analysis.
- View process status.
- Answer follow-up questions.
- View the plan after physician review.
- Follow longitudinal history.
- Update relevant information.

The experience must be simple, intuitive and mobile-first.

## 5.2. Physician

Physicians access a professional workspace to review proposals prepared by the system.

Features:

- View patients awaiting review.
- View clinical profiles.
- Read AI-structured summaries.
- Analyze preventive proposals.
- View rationales and evidence.
- Identify possible redundancies.
- View insufficient information.
- Approve, modify or reject proposals.
- Request clarification.
- Record rationales.
- Finalize reviews.
- View decision history.

The physician experience must prioritize desktop use, clarity, traceability and productivity.

---

# 6. Module 1 — Demonstration environment

Implement a demonstration environment with fictional patients.

The MVP must contain at least one complete, prepared scenario that can be presented quickly to judges.

Features:

- Select a demonstration patient.
- Switch between patient and physician views.
- Share data between the environments.
- Persist changes and decisions.
- Reset the demonstration.
- Clearly identify the environment as a prototype.

Do not initially implement complex authentication.

Role switching is exclusive to the demonstration environment and does not represent valid authorization for real clinical use.

---

# 7. Module 2 — Smart Health Intake

Implement guided health intake divided into steps.

## Step 1 — Basic information

Collect only the data needed for demonstration scenarios.

## Step 2 — Clinical history

- Previous conditions.
- Family history.
- Current medications.

## Step 3 — Habits

- Smoking.
- Physical activity.
- Other habits relevant to the scenario.

## Step 4 — Previous examinations

- Examination type.
- Date.
- Demonstration result.
- Notes.

## Step 5 — Answer review

Patients can review, correct and confirm their information.

After completion:

1. Data is saved.
2. The clinical profile is updated.
3. Analysis can begin.
4. Patient status is updated.

UX requirements:

- Progress indicator.
- Back and next navigation.
- Answer saving.
- Conditional questions.
- Validation.
- Answers such as "I don't know".
- Responsive form.
- Clear language.

Do not create an extensive or overly complex intake.

---

# 8. Module 3 — Clinical Profile

Implement a consolidated clinical-history view.

The profile must contain:

- Basic information.
- Personal history.
- Family history.
- Medications.
- Habits.
- Previous examinations.
- Missing information.
- Last updated date.

The profile is shared across patient, AI analysis and physician review flows.

Clearly distinguish patient-reported, structured and unknown information.

Do not create artificial health scores.

---

# 9. Module 4 — AI Clinical Analysis

This is the MVP's main technology module.

Integrate patient data, clinical context and an established LLM.

## Execution flow

1. The patient completes health intake.
2. The backend retrieves the structured profile.
3. It selects clinical context relevant to the scenario.
4. It applies required deterministic criteria and blocking checks.
5. It builds the AI model request.
6. The model returns a structured analysis.
7. The backend validates the response and its references.
8. Proposals are stored.
9. The patient moves to the awaiting physician review state.
10. The physician can view the analysis.

## AI responsibilities

- Create a structured clinical summary.
- Identify relevant information.
- Relate patient data to the supplied context.
- Explain the meaning of applicable rules.
- Organize possible preventive opportunities.
- Contextualize identified possible redundancies.
- Acknowledge missing information.
- Record uncertainties.
- Prepare explanations for the physician.

Do not implement unrestricted clinical analysis or generic consultations about any disease.

The model's scope is restricted to the situations selected for the MVP.

Output is always preliminary and requires human review.

---

# 10. Module 5 — Do Not Test Intelligence

Implement this as a capability within the clinical analysis flow.

Its objective is to demonstrate identification of possibly redundant or unnecessary tests.

## Example flow

1. The patient records a previous examination.
2. The system identifies the examination, its date and available information.
3. A demonstrative rule checks for possible redundancy.
4. The AI receives the check results.
5. The AI organizes a contextual explanation.
6. The physician views the proposal.
7. The physician accepts, modifies or rejects the assessment.
8. The reviewed result is recorded.

The system must explain:

- Which evaluation was analyzed.
- Which data was considered.
- Which criterion was applied.
- Why possible redundancy was identified.
- What limitations exist.

Do not assume every recent examination is unnecessary.

No flag may automatically become medical guidance for the patient.

---

# 11. Module 6 — Intelligent Clarification

Implement simple follow-up questions.

When essential data is missing, the system may request additional information.

The application determines which fields need clarification.

AI may help phrase the question in understandable language.

Example:

"You reported having an examination previously. Do you know approximately when it was performed?"

The patient answers and the information is saved.

If necessary, analysis runs again.

Do not create a full conversational chatbot.

Limit questions to the scope of demonstrative rules.

Allow patients to indicate that they do not know the answer.

---

# 12. Module 7 — Physician Review Workspace

Create a physician environment with two main screens.

## Screen A — Review queue

Present:

- Patient.
- Analysis date.
- Status.
- Action to open the review.

## Screen B — Clinical review

Divide the workspace into:

### Patient context

- Clinical history.
- Relevant factors.
- Medications.
- Previous examinations.
- Missing information.

### AI proposals

Each proposal must contain:

- Action name.
- Category.
- Rationale.
- Criteria considered.
- Linked evidence.
- Uncertainties.
- Review status.

### Physician decision

Allow:

- Approve.
- Modify.
- Reject.
- Leave pending.
- Request additional information.

Require a rationale for modifications or rejections.

Record:

- Demonstration reviewer identification.
- Date.
- Decision.
- Rationale.
- Analysis version.

Allow review finalization only when completion conditions are met.

Do not represent fictional user actions as real medical validation.

---

# 13. Module 8 — Personalized Preventive Plan

After review completion, generate an understandable preventive plan.

The plan must present:

- Follow-up summary.
- Selected actions.
- Evaluations considered potentially redundant and reviewed.
- Pending information.
- Next steps.
- Action states.

The view must be patient-oriented.

Avoid unnecessary technical language and complex explanations.

Displayed content must match decisions recorded in the physician workspace.

Do not publish proposals that have not been reviewed.

---

# 14. Module 9 — Longitudinal Health Twin

Implement a simplified longitudinal history.

The MVP Health Twin is not a predictive model or a complex biological representation.

It is a structure that preserves information and decisions over time.

Features:

- Event timeline.
- Evaluation history.
- Decision history.
- Previous plan versions.
- Profile changes.
- Basic comparison between cycles.

## Update flow

1. The patient has a previous plan.
2. The patient updates a piece of information.
3. The application saves a new profile version.
4. Context for the new analysis is prepared.
5. AI is used again within the controlled scope.
6. A new proposal is generated.
7. The physician reviews it.
8. A new plan can be published.
9. The previous version remains available.

---

# 15. Required end-to-end flows

## Flow A — First evaluation

Patient → Health intake → Clinical profile → AI analysis → Physician review → Preventive plan.

## Flow B — Do Not Test

Previous examination → Possible redundancy check → AI explanation → Physician review → Decision recording → Plan.

## Flow C — Clarification

Missing information → Follow-up question → Patient answer → Profile update → New analysis.

## Flow D — Reassessment

Previous plan → New information → New analysis → Physician review → New plan version → Preserved history.

## Flow E — AI failure

API failure, invalid response or insufficient evidence → Blocked analysis → Appropriate error message → Retry option → No automatically published proposal.

---

# 16. Application states

Implement clear states:

- NOT_STARTED
- INTAKE_IN_PROGRESS
- INTAKE_COMPLETED
- ANALYSIS_PENDING
- ANALYSIS_FAILED
- CLARIFICATION_REQUIRED
- MEDICAL_REVIEW_PENDING
- MEDICAL_REVIEW_IN_PROGRESS
- MEDICAL_REVIEW_COMPLETED
- PLAN_AVAILABLE
- REASSESSMENT_PENDING

Ensure consistency between backend states and the interface.

Do not allow access to unreviewed plans as if they were complete.

---

# 17. Design and experience

The visual identity is Clinical Premium SaaS.

The application must look like professional healthcare software rather than a generic AI-generated project.

Characteristics:

- Minimal.
- Modern.
- Clear.
- Trustworthy.
- Consistent.
- Responsive.
- Accessible.

The patient environment is mobile-first.

The physician environment is desktop-first.

Use a design system with centralized tokens for colors, typography, spacing, borders and states.

Avoid:

- A chatbot as the main interface.
- Excessive gradients.
- Too many cards.
- Arbitrary colors.
- Invented metrics.
- Inconsistent components.
- Decorative dashboards.
- Animation without a purpose.

AI should be integrated into the flows without visually dominating the application.

All interface text and documentation must use US English, with en-US date and number formatting (ADR0004).

---

# 18. Persistence and data

Persist the data required for the flows to work.

Core entities:

- Patient.
- HealthProfile.
- IntakeResponse.
- PreviousExamination.
- ClinicalContext.
- AIAnalysis.
- RecommendationProposal.
- MedicalReview.
- PreventivePlan.
- TimelineEvent.

Record the clinical-context version, model used and version of the analyzed information.

Preserve analysis and decision history.

Avoid storing extensive internal LLM reasoning; record only relevant inputs, references, structured results and metadata needed for traceability.

All prototype data must be synthetic.

---

# 19. What NOT to implement

Do not develop:

- Proprietary AI.
- Model training or fine-tuning.
- Proprietary predictive models.
- Knowledge graphs.
- Machine learning infrastructure.
- Multiagent orchestration.
- Complex RAG systems.
- Unnecessary vector databases.
- A native mobile application.
- Real laboratory integrations.
- Hospital integrations.
- Telemedicine.
- Payments.
- Scheduling.
- Examination OCR.
- An unrestricted medical chatbot.
- A marketplace.
- Enterprise dashboards.
- Wearable features.
- Clinical features for real patients.

These features may be considered in later phases.

---

# 20. MVP priorities

## P0 — Required

- Demonstration environment.
- Structured health intake.
- Clinical profile.
- API integration with an established LLM.
- Structured, versioned clinical context.
- Response validation.
- Preliminary AI-assisted clinical analysis.
- Demonstrative identification of possible redundancies.
- Physician workspace.
- Proposal review.
- Preventive plan.
- Basic longitudinal history.
- Persistence.
- Error and pending states.

## P1 — If time permits

- AI-assisted follow-up question wording.
- Plan version comparison.
- Automated change summaries.
- Additional demonstration improvements.

## P2 — Future

Commercial features, external integrations and advanced clinical intelligence.

---

# 21. MVP acceptance criteria

The prototype is ready when it can demonstrate:

1. A fictional patient starts an evaluation.
2. The patient completes health intake.
3. Information is persisted.
4. The backend prepares context for the LLM.
5. The real API integration performs the analysis.
6. The structured response is validated.
7. The system presents preliminary proposals.
8. A possible redundancy is identified.
9. Insufficient information is recognized.
10. The physician accesses the workspace.
11. The physician views evidence and rationales.
12. The physician approves, modifies or rejects proposals.
13. The physician finalizes the review.
14. The patient views the demonstration plan.
15. The patient updates a piece of information.
16. A new analysis runs.
17. Previous history is preserved.
18. The demonstration can be reset.

Presented cases must be synthetic, with predefined and tested expected outcomes.

Using an established LLM does not mean its proposals have been clinically validated.

---

# 22. Expected result

Build a working web MVP with a professional interface, two integrated experiences and an established AI model serving as a contextual assistant for medical decision support.

The technological distinction is not creating a proprietary AI model, but how Health360 organizes information, incorporates clinical context, applies rules, structures proposals, enables physician review and maintains continuity of follow-up.

The system must demonstrate three core capabilities:

**Personalized Prevention:** proposals contextualized by the patient's history.

**Do Not Test Intelligence:** identification of possibly redundant tests for physician review.

**Continuous Preventive Care:** preservation of information and longitudinal reassessment.

Prioritize quality and working flows over the number of features.

The MVP must remain restricted to synthetic-data demonstrations, without presenting proposals as clinically validated recommendations or making them available for real medical use.

**Health360 — Better decisions, not more tests.**
