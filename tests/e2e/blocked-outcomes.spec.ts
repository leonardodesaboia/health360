import { test, expect } from "./acceptance/helpers";

test("Daniel's reported rectal bleeding explains the blocked analysis and supports correcting information", async ({
  page,
  demo,
}) => {
  test.setTimeout(180000);
  await page.goto("/patient");
  await page
    .getByRole("button", { name: "Daniel Example", exact: true })
    .click();
  await expect(page.locator("#demo-case-title")).toHaveText(
    "Demo case: Daniel Example",
  );
  const token = await demo.track(page.context());
  await page.goto("/patient/intake");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await page.getByLabel("Rectal bleeding", { exact: true }).selectOption("yes");
  await page
    .getByRole("checkbox", { name: /I don't know.*current medications/ })
    .uncheck();
  await page
    .getByLabel("Current medications (enter None if none)", { exact: true })
    .fill("None");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await page
    .getByLabel("Currently smoking", { exact: true })
    .selectOption("no");
  await page
    .getByLabel("Regular physical activity", { exact: true })
    .selectOption("yes");
  for (let i = 0; i < 2; i++)
    await page
      .getByRole("button", { name: "Save and continue", exact: true })
      .click();
  await page
    .getByLabel(
      "I confirm these synthetic answers and want to save my profile.",
    )
    .check();
  await page
    .getByRole("button", { name: "Confirm and save profile", exact: true })
    .click();
  await expect(page).toHaveURL(/\/patient\/analysis$/);
  await page
    .getByRole("button", { name: "Analyze current profile", exact: true })
    .click();
  await expect(page.getByRole("main")).toContainText("Symptoms were reported");
  const snapshot = await demo.inspect(token);
  expect(snapshot.analyses.at(-1)).toMatchObject({
    status: "BLOCKED",
    failureReason: "out_of_scope",
    profileVersion: 2,
    proposalCount: 0,
  });
  await page.goto("/doctor");
  await page
    .getByRole("main")
    .getByRole("link", { name: "View blocked analysis", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole("main")).toContainText(
    "This screening demonstration does not apply when symptoms are reported",
  );
  await expect(page.getByRole("main")).toContainText(
    "Symptoms need assessment by a clinician",
  );
  await expect(page.getByRole("main")).toContainText(
    "Rule-generated from patient-reported information",
  );
  await expect(page.getByRole("main")).toContainText("Read-only result");
  await expect(
    page.getByRole("button", { name: /Save decisions|Finalize review/ }),
  ).toHaveCount(0);
  await expect(page.getByRole("main")).not.toContainText(
    "Decisions for analysis version",
  );
  await expect(page.getByRole("main")).not.toContainText(
    "proposals still need a decision",
  );
  await expect(page.getByRole("main")).not.toContainText(
    "Check context and evidence.",
  );
  await expect(page.getByRole("main")).not.toContainText(/retry/i);
  await page.screenshot({
    path: test.info().outputPath("blocked-physician.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "View patient status", exact: true })
    .click();
  for (const path of [
    "/patient/analysis",
    "/patient",
    "/patient/plan",
    "/patient/history",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("main")).toContainText(
      "Symptoms were reported",
    );
    await expect(
      page.getByRole("link", { name: "Update my information", exact: true }),
    ).toHaveAttribute("href", "/patient/intake");
    await expect(page.getByRole("main")).not.toContainText(/retry/i);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: test.info().outputPath("blocked-patient.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Update my information", exact: true })
    .focus();
  await expect(
    page.getByRole("link", { name: "Update my information", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/patient\/intake$/);
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await expect(page.getByLabel("Rectal bleeding", { exact: true })).toHaveValue(
    "yes",
  );
  await page.getByLabel("Rectal bleeding", { exact: true }).selectOption("no");
  for (let i = 0; i < 3; i++)
    await page
      .getByRole("button", { name: "Save and continue", exact: true })
      .click();
  await page
    .getByLabel(
      "I confirm these synthetic answers and want to save my profile.",
    )
    .check();
  await page
    .getByRole("button", { name: "Confirm and save profile", exact: true })
    .click();
  await expect(page).toHaveURL(/\/patient\/analysis$/);
  await page
    .getByRole("button", { name: "Analyze current profile", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Waiting for the demo reviewer",
      exact: true,
    }),
  ).toBeVisible();
  expect((await demo.inspect(token)).analyses.at(-1)).toMatchObject({
    status: "PRELIMINARY",
    profileVersion: 3,
  });
});
