import { expect, test } from "./acceptance/helpers";

for (const state of [
  {
    id: "daniel-review",
    label: "Daniel — family-history review",
    path: /\/doctor$/,
  },
  {
    id: "daniel-plan-v1",
    label: "Daniel — reviewed plan v1",
    path: /\/patient\/plan$/,
  },
]) {
  test(`${state.id} uses family-history evidence and the reviewed publication gate`, async ({
    page,
    demo,
  }) => {
    test.setTimeout(60000);
    await page.goto("/patient");
    await expect(page.locator("#demo-case-title")).toHaveText(
      "Select a demo case",
    );
    await page.getByText("Prepared starting points", { exact: true }).click();
    const button = page.getByRole("button", {
      name: state.label,
      exact: true,
      includeHidden: true,
    });
    await button.focus();
    await expect(button).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(state.path, { timeout: 30000 });
    const token = await demo.track(page.context());
    await expect(page.locator("#demo-case-title")).toHaveText(
      "Demo case: Daniel Example",
    );
    await page.reload();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByText(/DEMONSTRATIVE — NOT CLINICALLY VALIDATED/).first(),
    ).toBeVisible();
    const snapshot = await demo.inspect(token);
    if (state.id === "daniel-review") {
      expect(snapshot.status).toBe("MEDICAL_REVIEW_PENDING");
      expect(snapshot.plans).toEqual([]);
      await page
        .getByRole("main")
        .getByRole("link", { name: "Start review", exact: true })
        .filter({ visible: true })
        .click();
      await expect(
        page.getByLabel("Decision for proposal 1", { exact: true }),
      ).toHaveValue("PENDING");
      await expect(
        page.getByRole("button", { name: "Finalize review", exact: true }),
      ).toBeDisabled();
      await page
        .getByText("View rationale and criteria", { exact: true })
        .first()
        .click();
      await expect(page.getByRole("main")).toContainText(
        "first-degree family history",
      );
      await expect(page.getByRole("main")).toContainText(
        "age-45 average-risk criterion",
      );
      await expect(page.getByRole("main")).toContainText(
        "crc-family-history-early-start",
      );
      await page
        .getByText("View evidence and sources", { exact: true })
        .first()
        .click();
      await expect(page.getByRole("main")).toContainText(
        "usmstf-crc-family-history-2017",
      );
      await expect(
        page
          .getByRole("main")
          .getByRole("link", { name: /Open source:/ })
          .first(),
      ).toHaveAttribute("href", /asge\.org/);
      await page.goto("/patient/plan");
      await expect(page.getByRole("main")).not.toContainText(
        "Discuss starting colorectal screening",
      );
    } else {
      expect(snapshot.status).toBe("PLAN_AVAILABLE");
      expect(snapshot.plans).toHaveLength(1);
      expect(snapshot.plans[0].version).toBe(1);
      expect(snapshot.reviews).toBe(1);
      expect(snapshot.eventKinds).toContain("REVIEW_COMPLETED");
      expect(snapshot.eventKinds).toContain("PLAN_PUBLISHED");
      await expect(page.getByRole("main")).toContainText(
        "Reviewed demonstration plan",
      );
      await expect(page.getByRole("main")).toContainText("Plan version: 1");
      await expect(page.getByRole("main")).toContainText(
        "first-degree family history",
      );
    }
    await page.goto("/patient/profile");
    await expect(page.getByRole("main")).toContainText(
      "Patient-reported information",
    );
    await expect(
      page
        .getByText(
          "Was a parent, sibling or child diagnosed with colorectal cancer?",
          { exact: true },
        )
        .locator(".."),
    ).toContainText("Yes");
    await expect(
      page
        .getByText(
          "Age at diagnosis of the youngest affected parent, sibling or child",
          { exact: true },
        )
        .locator(".."),
    ).toContainText("50");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("Daniel baseline intake exposes nullable family facts and restores them", async ({
  page,
  demo,
}) => {
  await page.goto("/patient");
  await expect(page.locator("#demo-case-title")).toHaveText(
    "Select a demo case",
  );
  await page
    .getByRole("button", { name: "Daniel Example", exact: true })
    .click();
  await expect(page.locator("#demo-case-title")).toHaveText(
    "Demo case: Daniel Example",
  );
  await demo.track(page.context());
  await page.goto("/patient/intake");
  await page
    .getByLabel("Age in the synthetic scenario", { exact: true })
    .fill("40");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  const degree = page.getByLabel(
    "Was a parent, sibling or child diagnosed with colorectal cancer?",
    { exact: true },
  );
  const age = page.getByLabel(
    "Age at diagnosis of the youngest affected parent, sibling or child",
    { exact: true },
  );
  await page
    .getByLabel("Family history of colorectal cancer", { exact: true })
    .selectOption("yes");
  await degree.selectOption("unknown");
  await expect(age).toHaveCount(0);
  await degree.selectOption("yes");
  await page
    .getByRole("checkbox", { name: /I don't know — age at diagnosis/ })
    .uncheck();
  await age.fill("50");
  await page
    .getByRole("checkbox", { name: /I don't know — age at diagnosis/ })
    .check();
  await expect(age).toBeDisabled();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.reload();
  await expect(degree).toHaveValue("yes");
  await expect(age).toBeDisabled();
  await page
    .getByRole("checkbox", { name: /I don't know — age at diagnosis/ })
    .uncheck();
  await age.fill("50");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.reload();
  await expect(age).toHaveValue("50");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
