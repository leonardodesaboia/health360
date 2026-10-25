import {
  test,
  expect,
  selectCase,
  completeFirstIntake,
  assertNoUnreviewedPlan,
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
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Awaiting physician review", { exact: true }),
  ).toBeVisible();
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

  const other = await browser.newContext();
  try {
    const otherPage = await other.newPage();
    await selectCase(otherPage, "Jordan Example");
    const otherToken = await demo.track(other);
    const before = await demo.inspect(otherToken);
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
    ).toBeVisible();
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

// TODO(P0-10): replace with real decision controls, reasons, explicit finalization and patient-plan assertions.
test.fixme("Flows A/B completion: physician decisions and finalization publish only reviewed content", async () => {
  throw new Error(
    "TODO(P0-10): implement actual physician decisions and finalization acceptance",
  );
});
// TODO(P0-12): supported question templates, I don't know, immutable profile version and reanalysis; stale review rejection.
test.fixme("Flow C: clarification answer or unknown persists and re-enters guarded analysis", async () => {
  throw new Error("TODO(P0-12): implement actual clarification acceptance");
});
// TODO(P0-10, P0-12): finish cycle two through actual review UI and verify plan v2 plus preserved v1.
test.fixme("Flow D completion: updated information receives a new finalized review and plan v2", async () => {
  throw new Error(
    "TODO(P0-10, P0-12): implement the complete second review cycle",
  );
});
