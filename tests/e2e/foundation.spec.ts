import { expect, test } from "@playwright/test";

const routes = [
  ["/patient", "Hello, Marina"],
  ["/patient/intake", "Guided health intake"],
  ["/patient/profile", "Clinical profile"],
  ["/patient/plan", "Preventive follow-up"],
  ["/doctor", "Review queue"],
  ["/doctor/reviews/demo-review-01", "Marina Example"],
  ["/showcase", "Component library"],
];
for (const [route, title] of routes) {
  test(`${route} renders without overflow or runtime errors`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("heading", { name: title, exact: true, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText(/DEMONSTRATIVE — NOT CLINICALLY VALIDATED/).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Demonstration environment", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}
test("patient and doctor navigation and review boundary", async ({ page }) => {
  await page.goto("/patient");
  await page.getByRole("link", { name: "View my history" }).click();
  await expect(page).toHaveURL(/\/patient\/intake$/);
  await page.getByRole("link", { name: "My plan", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "No plan available in this example",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: /View as physician/ }).click();
  await expect(page.getByText("Oct 20, 2026")).toBeVisible();
  await page.getByRole("link", { name: "Open review" }).click();
  await expect(
    page.getByRole("button", { name: "Approve", exact: true }),
  ).toBeDisabled();
  await page.getByText("View evidence and sources").click();
  await expect(
    page.getByText(/No clinical evidence has been loaded/),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to queue" }).click();
  await expect(page).toHaveURL(/\/doctor$/);
});
test("skip link receives keyboard focus and reaches main", async ({ page }) => {
  await page.goto("/patient");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});
test("showcase validates accessibly without persisting data", async ({
  page,
}) => {
  await page.goto("/showcase");
  await page.getByRole("button", { name: "Validate example" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Use at least two characters." }),
  ).toBeVisible();
  await expect(page.getByLabel("Example text")).toBeFocused();
  await page.getByLabel("Example text").fill("Synthetic example");
  await page.getByRole("button", { name: "Validate example" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Valid format. The text was not saved.",
  );
  await page.reload();
  await expect(page.getByLabel("Example text")).toHaveValue("");
});
test("unknown review does not disclose another fixture", async ({ page }) => {
  const response = await page.goto("/doctor/reviews/unknown");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});
