import {
  test,
  expect,
  selectCase,
  completeFirstIntake,
  completeRepeatIntake,
  openPhysicianWorkspace,
  decideAndFinalize,
  assertNoUnreviewedPlan,
  afterAction,
} from "./helpers";

test.setTimeout(180000);
test.use({ actionTimeout: 15000 });

test("Flow A part 1: real intake reaches the physician queue, persists and resets in isolation", async ({
  page,
  context,
  browser,
  demo,
}) => {
  await selectCase(page, "Alex Example");
  const token = await demo.track(context);
  await completeFirstIntake(page);
  await page.reload();
  await page
    .getByRole("button", { name: "Analyze current profile", exact: true })
    .click();
  await expect(
    page.getByText("Awaiting physician review", { exact: true }),
  ).toBeVisible(afterAction);
  await page.reload();
  await expect(
    page.getByText("Awaiting physician review", { exact: true }),
  ).toBeVisible(afterAction);
  const persisted = await demo.inspect(token);
  expect(persisted.profiles).toContainEqual({ version: 2, age: 50 });
  expect(persisted.analyses).toEqual([
    { status: "PRELIMINARY", profileVersion: 2, proposalCount: 1 },
  ]);
  expect(persisted.plans).toEqual([]);
  await assertNoUnreviewedPlan(page);
  await page.goto("/doctor");
  await expect(page.getByRole("main")).toContainText("Alex Example");
  await expect(
    page.getByRole("link", { name: "Open review", exact: true }),
  ).toHaveCount(1);
  await page.getByRole("link", { name: "Open review", exact: true }).focus();
  await expect(
    page.getByRole("link", { name: "Open review", exact: true }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await openPhysicianWorkspace(page, "Alex Example");
  const main = page.getByRole("main");
  const proposal = main.getByRole("article");
  await expect(
    proposal.getByText("Preventive opportunity · Awaiting physician review", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    proposal.getByText("Rule-generated", { exact: true }),
  ).toBeVisible();
  await expect(
    proposal.getByText("AI-generated", { exact: true }),
  ).toBeVisible();
  await expect(
    proposal.getByText("Explanation wording only", { exact: true }),
  ).toBeVisible();
  await expect(main).toContainText(
    "Preliminary proposals, awaiting physician review.",
  );
  await expect(main).toContainText("crc-screening-due · Rule v1");
  await expect(main).toContainText("US Preventive Services Task Force");
  await expect(
    page.getByRole("link", { name: /^Open source: / }).first(),
  ).toBeVisible();
  await page.goto("/doctor");

  const other = await browser.newContext();
  try {
    const otherPage = await other.newPage();
    await selectCase(otherPage, "Jordan Example");
    const otherToken = await demo.track(other);
    const before = await demo.inspect(otherToken);
    await page.getByText("Presenter controls", { exact: true }).click();
    await page.getByRole("button", { name: "Reset demo", exact: true }).click();
    expect((await demo.inspect(token)).analyses).toEqual([]);
    expect(await demo.inspect(otherToken)).toEqual(before);
    await otherPage.reload();
    await expect(
      otherPage.getByRole("heading", {
        name: "Demo case: Jordan Example",
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    await other.close();
  }
});

for (const [variant, reason] of [
  ["timeout", "timeout"],
  ["api-error", "api_error"],
  ["malformed", "invalid_output"],
  ["unknown-evidence", "unsupported_evidence"],
  ["unsupported-category", "invalid_output"],
  ["insufficient-support", "unsupported_scope"],
] as const) {
  test(`Flow E: ${variant} fails closed; browser retry preserves history and requires review`, async ({
    page,
    context,
    demo,
  }) => {
    await selectCase(page, "Alex Example");
    const token = await demo.track(context);
    await completeFirstIntake(page);
    const failed = await demo.fail(token, variant);
    expect(failed.status).toBe("ANALYSIS_FAILED");
    expect(failed.analyses).toEqual([
      {
        status: "BLOCKED",
        failureReason: reason,
        profileVersion: 2,
        proposalCount: 0,
      },
    ]);
    expect(failed.plans).toEqual([]);
    await page.reload();
    await expect(page.getByRole("status")).toContainText(
      "No new proposals are available",
    );
    await expect(page.getByRole("main")).not.toContainText(
      /UNTRUSTED_RESPONSE_MARKER|unknown-evidence-test-only|OPENAI_API_KEY|stack trace/,
    );
    await assertNoUnreviewedPlan(page);
    await page.goto("/patient/analysis");
    await page
      .getByRole("button", { name: "Retry analysis", exact: true })
      .click();
    await expect(
      page.getByText("Awaiting physician review", { exact: true }),
    ).toBeVisible(afterAction);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Retry analysis", exact: true }),
    ).toHaveCount(0);
    const retried = await demo.inspect(token);
    expect(retried.analyses).toEqual([
      ...failed.analyses,
      { status: "PRELIMINARY", profileVersion: 2, proposalCount: 1 },
    ]);
    expect(retried.reviews).toBe(0);
    expect(retried.plans).toEqual([]);
    expect(retried.eventKinds).toEqual(
      expect.arrayContaining(["ANALYSIS_FAILED", "ANALYSIS_CREATED"]),
    );
    await assertNoUnreviewedPlan(page);
  });
}

test("Flow D start: fixture-reviewed plan v1 is preserved when real reassessment starts", async ({
  page,
  context,
  baseURL,
  demo,
}) => {
  if (!baseURL) throw new Error("Configured loopback URL required");
  const fixture = await demo.reviewed();
  await context.addCookies([
    {
      name: "h360_demo_session",
      value: fixture.token,
      url: baseURL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const before = await demo.inspect(fixture.token);
  expect(before.plans).toHaveLength(1);
  await page.goto("/patient/history");
  await page
    .getByRole("button", { name: "Update my information", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/patient\/intake$/);
  await expect(
    page.getByLabel("Age in the synthetic scenario", { exact: true }),
  ).toHaveValue("50");
  await page.goto("/patient/plan");
  await expect(
    page.getByText("Previous reviewed plan", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Reviewed action wording", { exact: true }),
  ).toBeVisible();
  await page.reload();
  const after = await demo.inspect(fixture.token);
  expect(after.plans).toEqual(before.plans);
  expect(after.analyses).toEqual(before.analyses);
  expect(after.reviews).toBe(before.reviews);
  expect(after.eventKinds).toContain("REASSESSMENT_REQUESTED");
  await page.goto("/patient/history");
  await expect(
    page.getByRole("link", { name: "View plan version 1", exact: true }),
  ).toBeVisible();
});

test("Flow A completion: explicit approval and finalization publish only the reviewed plan", async ({
  page,
  context,
  demo,
}) => {
  await selectCase(page, "Alex Example");
  const token = await demo.track(context);
  await completeFirstIntake(page);
  await page
    .getByRole("button", { name: "Analyze current profile", exact: true })
    .click();
  await expect(
    page.getByText("Awaiting physician review", { exact: true }),
  ).toBeVisible(afterAction);
  await assertNoUnreviewedPlan(page);
  await decideAndFinalize(page, "Alex Example", { kind: "APPROVE" });

  const persisted = await demo.inspect(token);
  expect(persisted.plans).toHaveLength(1);
  expect(persisted.plans[0].version).toBe(1);
  await page.goto("/patient/plan");
  const plan = page.getByRole("main");
  await expect(
    plan.getByText("Reviewed demonstration plan", { exact: true }),
  ).toBeVisible();
  await expect(
    plan.getByRole("heading", { name: "Selected actions", exact: true }),
  ).toBeVisible();
  await expect(plan).not.toContainText(/crc-screening-due|AI-generated/);
  await page.goto("/patient/history");
  await expect(
    page.getByRole("link", { name: "View plan version 1", exact: true }),
  ).toBeVisible();
});

test("Flow B completion: a modified redundancy proposal publishes only the physician's revised wording", async ({
  page,
  context,
  demo,
}) => {
  await selectCase(page, "Jordan Example");
  const token = await demo.track(context);
  await completeRepeatIntake(page, { examDate: "2022-11-03" });
  await page
    .getByRole("button", { name: "Analyze current profile", exact: true })
    .click();
  await expect(
    page.getByText("Awaiting physician review", { exact: true }),
  ).toBeVisible(afterAction);
  const revised =
    "Discuss with your physician whether a repeat colonoscopy is needed now.";
  await decideAndFinalize(page, "Jordan Example", {
    kind: "MODIFY",
    reason: "Demonstrative revision; plain-language wording for the patient.",
    revised,
  });
  expect((await demo.inspect(token)).plans).toHaveLength(1);
  await page.goto("/patient/plan");
  const plan = page.getByRole("main");
  await expect(plan.getByText(revised, { exact: true })).toBeVisible();
  await expect(plan).not.toContainText(
    /Review supplied possible redundancy|crc-routine-repeat/,
  );
});
test("Flow B: Jordan's recent normal colonoscopy yields a traceable preliminary possible-redundancy proposal", async ({
  page,
  context,
  demo,
}) => {
  await selectCase(page, "Jordan Example");
  const token = await demo.track(context);
  await completeRepeatIntake(page, { examDate: "2022-11-03" });
  await page
    .getByRole("button", { name: "Analyze current profile", exact: true })
    .click();
  await expect(
    page.getByText("Awaiting physician review", { exact: true }),
  ).toBeVisible(afterAction);
  const persisted = await demo.inspect(token);
  expect(persisted.analyses).toEqual([
    { status: "PRELIMINARY", profileVersion: 2, proposalCount: 1 },
  ]);
  expect(persisted.reviews).toBe(0);
  expect(persisted.plans).toEqual([]);
  // Preliminary only: the patient never sees the proposal as advice before review.
  await assertNoUnreviewedPlan(page);
  await expect(page.getByRole("main")).not.toContainText(
    /Possible redundant test|crc-routine-repeat/,
  );

  await openPhysicianWorkspace(page, "Jordan Example");
  const main = page.getByRole("main");
  const proposal = main.getByRole("article");
  await expect(
    proposal.getByText("Possible redundant test · Awaiting physician review", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    proposal.getByText("Rule-generated", { exact: true }),
  ).toBeVisible();
  await expect(
    proposal.getByText("AI-generated", { exact: true }),
  ).toBeVisible();
  await expect(
    proposal.getByText("Explanation wording only", { exact: true }),
  ).toBeVisible();
  await expect(main).toContainText("crc-routine-repeat · Rule v1");
  await expect(main).toContainText("2022-11-03");
  await expect(main).toContainText(
    "A recent test alone does not establish redundancy",
  );
  await expect(main).toContainText(
    "US Multi-Society Task Force on Colorectal Cancer",
  );
});

for (const answer of ["date", "unknown"] as const) {
  test(`Flow C: Jordan's unknown exam date answered with ${answer === "date" ? "the date" : "I don't know"} saves a new profile version and re-enters guarded analysis`, async ({
    page,
    context,
    demo,
  }) => {
    await selectCase(page, "Jordan Example");
    const token = await demo.track(context);
    await completeRepeatIntake(page, { examDate: null });
    await page
      .getByRole("button", { name: "Analyze current profile", exact: true })
      .click();
    await expect(
      page.getByText("More information needed", { exact: true }),
    ).toBeVisible(afterAction);
    await assertNoUnreviewedPlan(page);

    await page.goto("/patient/analysis");
    await page
      .getByRole("link", { name: "Answer missing information", exact: true })
      .click();
    const question =
      "On what exact date was your previous screening examination?";
    const unknown = page.getByLabel(
      `I don't know — ${question.charAt(0).toLowerCase()}${question.slice(1)}`,
      { exact: true },
    );
    await expect(unknown).toBeChecked();
    if (answer === "date") {
      await unknown.uncheck();
      await page.getByLabel(question, { exact: true }).fill("2022-11-03");
    }
    await page
      .getByRole("button", {
        name: "Save answers and analyze again",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/\/patient\/analysis$/, afterAction);
    await expect(
      page.getByText(
        answer === "date"
          ? "Awaiting physician review"
          : "More information needed",
        { exact: true },
      ),
    ).toBeVisible(afterAction);

    const persisted = await demo.inspect(token);
    expect(persisted.profiles.map((profile) => profile.version)).toEqual(
      expect.arrayContaining([1, 2, 3]),
    );
    expect(persisted.analyses).toEqual([
      expect.objectContaining({
        status: "BLOCKED",
        profileVersion: 2,
        proposalCount: 0,
      }),
      expect.objectContaining({
        status: answer === "date" ? "PRELIMINARY" : "BLOCKED",
        profileVersion: 3,
        proposalCount: answer === "date" ? 1 : 0,
      }),
    ]);
    expect(persisted.eventKinds).toEqual(
      expect.arrayContaining([
        "CLARIFICATION_REQUESTED",
        "CLARIFICATION_ANSWERED",
      ]),
    );
    expect(persisted.reviews).toBe(0);
    expect(persisted.plans).toEqual([]);
    await assertNoUnreviewedPlan(page);
    if (answer === "date") {
      await openPhysicianWorkspace(page, "Jordan Example");
      await expect(page.getByRole("main")).toContainText(
        "crc-routine-repeat · Rule v1",
      );
    }
  });
}
test("Flow D completion: updated information receives a new finalized review and plan v2 while v1 is preserved", async ({
  page,
  context,
  demo,
}) => {
  await selectCase(page, "Alex Example");
  const token = await demo.track(context);
  await completeFirstIntake(page);
  await page
    .getByRole("button", { name: "Analyze current profile", exact: true })
    .click();
  await expect(
    page.getByText("Awaiting physician review", { exact: true }),
  ).toBeVisible(afterAction);
  await decideAndFinalize(page, "Alex Example", { kind: "APPROVE" });
  const cycleOne = await demo.inspect(token);
  expect(cycleOne.plans).toHaveLength(1);

  await page.goto("/patient/history");
  await page
    .getByRole("button", { name: "Update my information", exact: true })
    .click();
  await expect(page).toHaveURL(/\/patient\/intake$/, afterAction);
  await completeFirstIntake(page);
  await page
    .getByRole("button", { name: "Analyze current profile", exact: true })
    .click();
  await expect(
    page.getByText("Awaiting physician review", { exact: true }),
  ).toBeVisible(afterAction);
  await decideAndFinalize(page, "Alex Example", { kind: "APPROVE" });

  const cycleTwo = await demo.inspect(token);
  expect(cycleTwo.plans.map((plan) => plan.version).sort()).toEqual([1, 2]);
  expect(cycleTwo.plans).toEqual(expect.arrayContaining(cycleOne.plans));
  expect(cycleTwo.eventKinds).toContain("REASSESSMENT_REQUESTED");
  await page.goto("/patient/history");
  for (const version of [1, 2])
    await expect(
      page.getByRole("link", {
        name: `View plan version ${version}`,
        exact: true,
      }),
    ).toBeVisible();
});
