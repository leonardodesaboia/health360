import { expect, test } from "@playwright/test";
import {
  test as journeyTest,
  assertPatientGuidance,
  selectCase,
} from "./acceptance/helpers";

journeyTest(
  "intake drafting stays distinct from a confirmed profile",
  async ({ page, context, demo }, testInfo) => {
    journeyTest.setTimeout(120000);
    await page.setViewportSize({
      width: testInfo.project.name === "desktop" ? 1440 : 390,
      height: 900,
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await selectCase(page, "Alex Example");
    const token = await demo.track(context);
    await assertPatientGuidance(page, {
      heading: "Start your health intake",
      actor: "You",
      action: "Start health intake",
      kind: "link",
      stages: [
        "IntakeNot started",
        "AnalysisWaiting",
        "Physician reviewWaiting",
        "PlanWaiting",
      ],
    });
    const before = await demo.inspect(token);
    await page.goto("/patient/intake");
    await expect(
      page.getByText("Intake · Save your information before analysis", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("progressbar", { name: "Intake questions", exact: true }),
    ).toHaveAttribute("aria-valuenow", "1");
    await page
      .getByLabel("Age in the synthetic scenario", { exact: true })
      .fill("51");
    const save = page.getByRole("button", { name: "Save draft", exact: true });
    await save.focus();
    await expect(save).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toContainText(
      "Draft saved in this browser only.",
    );
    expect((await demo.inspect(token)).profiles).toEqual(before.profiles);
    await page.reload();
    await expect(
      page.getByLabel("Age in the synthetic scenario", { exact: true }),
    ).toHaveValue("51");
    await expect(
      page.getByRole("form", { name: "What happens next", exact: true }),
    ).toContainText(
      "Your draft is saved in this browser. Confirm your answers to save a profile for this demo case.",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("intake-draft.png"),
      fullPage: true,
    });
  },
);

journeyTest(
  "plan update navigation only opens the guarded history form",
  async ({ page, context, baseURL, demo }, testInfo) => {
    journeyTest.setTimeout(120000);
    await page.setViewportSize({
      width: testInfo.project.name === "desktop" ? 1440 : 390,
      height: 900,
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (!baseURL) throw new Error("Application URL required");
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
    await page.goto("/patient/plan");
    await assertPatientGuidance(page, {
      heading: "Your reviewed demonstration plan",
      actor: "You",
      action: "View update options",
      kind: "link",
      stages: [
        "IntakeComplete",
        "AnalysisComplete",
        "Physician reviewComplete",
        "PlanComplete",
      ],
    });
    await expect(page.getByRole("main")).toContainText(
      "Action tracking is not available in this demonstration.",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("reviewed-plan.png"),
      fullPage: true,
    });
    const link = page.getByRole("link", {
      name: "View update options",
      exact: true,
    });
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/patient\/history#update-information$/);
    await expect(page.locator("#update-information")).toBeFocused();
    await expect(
      page
        .locator("#update-information")
        .getByRole("button", { name: "Update my information", exact: true }),
    ).toBeVisible();
    expect(await demo.inspect(fixture.token)).toEqual(before);
  },
);

test("entry page identifies the product and leads into the demo", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Better decisions, not more tests",
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("DEMONSTRATIVE — NOT CLINICALLY VALIDATED").first(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Start the patient demo" }).click();
  await expect(page).toHaveURL(/\/patient$/);
  await expect(
    page.getByRole("heading", { name: "Select a demo case", level: 1 }),
  ).toBeVisible();
});

test("profile shows the selected case's stored profile and home shows its next step", async ({
  page,
}) => {
  await page.goto("/patient");
  await page
    .getByRole("form", { name: "Choose demo case" })
    .getByRole("button", { name: "Jordan Example", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Demo case: Jordan Example" }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByRole("link", { name: "Start health intake" }),
  ).toBeVisible();
  await page.goto("/patient/profile");
  await expect(
    page.getByRole("heading", { name: "Structured profile", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("saved to this demo case")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No confirmed profile yet" }),
  ).toHaveCount(0);
});
