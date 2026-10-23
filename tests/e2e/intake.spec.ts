import { test, expect } from "@playwright/test";
test("intake validates, preserves unknown answers and restores a draft", async ({
  page,
}) => {
  await page.goto("/patient/intake");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Enter an age",
  );
  await expect(
    page.getByLabel("Age in the synthetic scenario", { exact: true }),
  ).toBeFocused();
  await page.getByRole("checkbox", { name: /I don't know — age/ }).check();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Clinical history" }),
  ).toBeFocused();
  await page
    .getByLabel("Personal history of colorectal cancer", { exact: true })
    .selectOption("yes");
  await expect(
    page.getByLabel(
      "Details of the declared personal history (synthetic only)",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.reload();
  await expect(
    page.getByLabel("Personal history of colorectal cancer", { exact: true }),
  ).toHaveValue("yes");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: /I don't know — age/ }),
  ).toBeChecked();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("storage failures do not claim a successful save", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  await page.goto("/patient/intake");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "could not be saved",
  );
  await expect(page.getByRole("status")).not.toContainText("Draft saved");
});

test("malformed storage is preserved and can be retried after recovery", async ({
  page,
}) => {
  await page.goto("/patient/intake");
  await page.evaluate(() =>
    localStorage.setItem("health360:intake:v1:demo-patient-01", "{}"),
  );
  await page.reload();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "could not be loaded",
  );
  await expect(
    page.getByRole("button", { name: "Save draft", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("health360:intake:v1:demo-patient-01"),
    ),
  ).toBe("{}");
  await page.evaluate(() =>
    localStorage.removeItem("health360:intake:v1:demo-patient-01"),
  );
  await page.getByRole("button", { name: "Reload saved draft" }).click();
  await expect(
    page.getByRole("button", { name: "Save draft", exact: true }),
  ).toBeVisible();
});
