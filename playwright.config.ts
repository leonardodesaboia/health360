import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3100);
const baseURL = `http://127.0.0.1:${port}`;
const navigationRegression = "**/navigation-latency.spec.ts";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      testIgnore: navigationRegression,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testIgnore: navigationRegression,
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    // Measure recorded navigation after functional tests, without competing test workloads.
    {
      name: "navigation-desktop",
      testMatch: navigationRegression,
      dependencies: ["desktop", "mobile"],
      workers: 1,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "navigation-mobile",
      testMatch: navigationRegression,
      dependencies: ["navigation-desktop"],
      workers: 1,
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: `pnpm start --port ${port}`,
    url: `${baseURL}/patient`,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
