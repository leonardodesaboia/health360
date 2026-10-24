import { test, expect } from "@playwright/test";

test("analysis status without a demo session offers no analysis or proposals", async ({
  page,
}) => {
  await page.goto("/patient/analysis");
  await expect(
    page.getByRole("heading", { name: "Analysis status" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByText("DEMONSTRATIVE — NOT CLINICALLY VALIDATED", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Select a synthetic demonstration case to begin.",
  );
  await expect(
    page.getByRole("button", { name: /Analyze|Retry analysis/ }),
  ).toHaveCount(0);
  await expect(page.getByText(/proposal:|recommendation:/i)).toHaveCount(0);
});

test("analysis error query shows a bounded retry message", async ({ page }) => {
  await page.goto("/patient/analysis?error=1");
  await expect(page.getByRole("status")).toContainText(
    "The analysis could not be completed.",
  );
  await expect(page.getByRole("status")).not.toContainText(/database|stack/i);
});
