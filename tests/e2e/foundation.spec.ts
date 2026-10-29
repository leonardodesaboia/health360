import { expect, test } from "@playwright/test";

const routes = [
  ["/patient", "Select a demo case"],
  ["/patient/intake", "Guided health intake"],
  ["/patient/profile", "Clinical profile"],
  ["/patient/plan", "Preventive follow-up"],
  ["/doctor", "Review queue"],
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
  await page.goto("/patient/intake");
  await expect(page).toHaveURL(/\/patient\/intake$/);
  await page.getByRole("link", { name: "My plan", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Select a demonstration case",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: /View as physician/ }).click();
  const queue = page.getByRole("main");
  await expect(
    queue.getByRole("heading", { name: "No demo case selected", exact: true }),
  ).toBeVisible();
  await expect(queue.locator('a[href^="/doctor/reviews/"]')).toHaveCount(0);
  const chooseCase = queue.getByRole("link", {
    name: "Choose a demo case",
    exact: true,
  });
  await expect(chooseCase).toHaveAttribute("href", "/patient#demo-case-title");
  await chooseCase.click();
  await expect(page).toHaveURL(/\/patient#demo-case-title$/);
});
test("physician header describes demonstration reviews without validation claims", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/doctor");
  const header = page.getByRole("banner");
  await expect(
    header.getByText("Physician view · Demo reviewer", { exact: true }),
  ).toBeVisible();
  await expect(
    header.getByText("Demo navigation only; no sign-in or authorization.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/DEMONSTRATIVE — NOT CLINICALLY VALIDATED/).first(),
  ).toBeVisible();
  await expect(header).not.toContainText("Interface reference");
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
  expect([200, 404]).toContain(response?.status());
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(
    page.getByRole("heading", { name: "Patient context" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});
