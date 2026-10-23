import { expect, test } from "@playwright/test";

test("history navigation explains the missing session without revealing any records", async ({
  page,
}) => {
  await page.goto("/patient");
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your follow-up history" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Select a demonstration case" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Update my information" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "History", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Go to Home" }).focus();
  await expect(page.getByRole("link", { name: "Go to Home" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/patient$/);
});

test("a direct historical plan URL cannot read a plan without its selected dataset", async ({
  page,
}) => {
  await page.goto("/patient/history/another-dataset-plan");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Selected actions" }),
  ).toHaveCount(0);
});
