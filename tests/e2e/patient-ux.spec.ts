import { expect, test } from "@playwright/test";

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
