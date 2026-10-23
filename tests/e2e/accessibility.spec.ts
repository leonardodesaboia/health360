import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("main demo routes have no serious or critical axe violations", async ({
  page,
}) => {
  for (const route of [
    "/patient",
    "/patient/intake",
    "/patient/profile",
    "/patient/plan",
    "/doctor",
    "/showcase",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(
      violations.filter(({ impact }) =>
        ["serious", "critical"].includes(impact ?? ""),
      ),
      `Accessibility violations on ${route}`,
    ).toEqual([]);
  }
});
