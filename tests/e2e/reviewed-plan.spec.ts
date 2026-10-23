import { expect, test } from "@playwright/test";

test("direct patient plan URL does not expose preliminary proposals without a session", async ({
  page,
}) => {
  await page.goto("/patient/plan");
  await expect(
    page.getByRole("heading", { name: "Preventive follow-up" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Select a demonstration case" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Selected actions" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("DEMONSTRATIVE — NOT CLINICALLY VALIDATED", {
      exact: false,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Track evaluation" }).focus();
  await expect(
    page.getByRole("link", { name: "Track evaluation" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/patient$/);
});
