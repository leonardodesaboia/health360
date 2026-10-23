import { test, expect } from "@playwright/test";

test("review, edit and confirm a synthetic profile with unknown exam facts", async ({
  page,
}) => {
  await page.goto("/patient/intake");
  await page
    .getByLabel("Age in the synthetic scenario", { exact: true })
    .fill("52");
  await page.getByRole("button", { name: "Save and continue" }).click();
  for (const control of await page.getByRole("combobox").all())
    await control.selectOption("unknown");
  await page
    .getByRole("checkbox", { name: /I don't know.*current medications/ })
    .check();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page
    .getByLabel("Currently smoking", { exact: true })
    .selectOption("no");
  await page
    .getByLabel("Regular physical activity", { exact: true })
    .selectOption("unknown");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page
    .getByLabel("Previous colorectal screening", { exact: true })
    .selectOption("COLONOSCOPY");
  for (const control of await page.getByRole("combobox").all()) {
    if ((await control.getAttribute("id")) !== "priorScreening")
      await control.selectOption("unknown");
  }
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Review answers" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Edit basic information" }).click();
  await page
    .getByLabel("Age in the synthetic scenario", { exact: true })
    .fill("53");
  for (let step = 0; step < 4; step++)
    await page.getByRole("button", { name: "Save and continue" }).click();
  await page.getByRole("button", { name: "Confirm and save profile" }).click();
  await expect(
    page.getByRole("checkbox", { name: /I confirm these synthetic/ }),
  ).toBeFocused();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Confirm your answers",
  );
  await page
    .getByRole("checkbox", { name: /I confirm these synthetic/ })
    .check();
  await page.getByRole("button", { name: "Confirm and save profile" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Profile version 1 saved",
  );
  await page
    .getByRole("link", { name: "View clinical profile", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Clinical profile", exact: true }),
  ).toBeVisible();
  const structured = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Structured profile",
      exact: true,
    }),
  });
  await expect(structured).toContainText("53");
  await expect(structured.getByText("1", { exact: true })).toBeVisible();
  const exams = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Previous examinations",
      exact: true,
    }),
  });
  await expect(exams).toContainText("Date: Unknown");
  await expect(exams).toContainText("Result: Unknown");
  await page.reload();
  await expect(structured).toContainText("53");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("profile empty and failed storage states offer recovery", async ({
  page,
}) => {
  await page.goto("/patient/profile");
  await expect(
    page.getByRole("heading", { name: "No confirmed profile yet" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Complete intake" }).click();
  await expect(page).toHaveURL(/\/patient\/intake$/);
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Unavailable");
    };
  });
  await page.goto("/patient/profile");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "could not be loaded",
  );
  await expect(
    page.getByRole("button", { name: "Retry profile" }),
  ).toBeVisible();
});

test("stale intake in another tab cannot overwrite newer answers", async ({
  page,
  context,
}) => {
  await page.goto("/patient/intake");
  await page
    .getByLabel("Age in the synthetic scenario", { exact: true })
    .fill("52");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  const other = await context.newPage();
  await other.goto("/patient/intake");
  await expect(
    other.getByLabel("Age in the synthetic scenario", { exact: true }),
  ).toHaveValue("52");
  await page
    .getByLabel("Age in the synthetic scenario", { exact: true })
    .fill("53");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await other
    .getByLabel("Age in the synthetic scenario", { exact: true })
    .fill("54");
  await other.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(other.getByRole("main").getByRole("alert")).toContainText(
    "newer draft",
  );
  await other.getByRole("button", { name: "Reload saved draft" }).click();
  await expect(
    other.getByLabel("Age in the synthetic scenario", { exact: true }),
  ).toHaveValue("53");
  await other.close();
});
