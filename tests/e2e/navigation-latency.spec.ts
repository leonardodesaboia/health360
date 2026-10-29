import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { expect, test } from "./acceptance/helpers";

const require = createRequire(import.meta.url);
test.use({
  video: { mode: "retain-on-failure", size: { width: 1440, height: 1000 } },
});

test("repeated client navigation completes promptly without transaction-start failures", async ({
  page,
  context,
  demo,
}, info) => {
  test.setTimeout(180000);
  // Own the production process so P2028 cannot be hidden by a route error boundary.
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const address = reservation.address();
  if (!address || typeof address === "string") throw new Error("Port required");
  const port = address.port;
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const origin = `http://127.0.0.1:${port}`;
  let serverLog = "";
  const server = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { env: process.env, windowsHide: true, stdio: "pipe" },
  );
  server.stdout.on("data", (chunk: Buffer) => {
    serverLog += chunk.toString();
  });
  server.stderr.on("data", (chunk: Buffer) => {
    serverLog += chunk.toString();
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.url().startsWith(origin) && response.status() >= 500)
      errors.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  const timings: { route: string; ms: number; at: number }[] = [];
  try {
    await expect
      .poll(
        async () => {
          try {
            return (await fetch(`${origin}/api/health`)).status;
          } catch {
            return 0;
          }
        },
        { timeout: 30000 },
      )
      .toBe(200);
    await page.goto(`${origin}/patient`);
    await expect(page.locator("#demo-case-title")).toHaveText(
      "Select a demo case",
    );
    await page.getByText("Prepared starting points", { exact: true }).click();
    await page
      .getByRole("button", { name: "Alex — reviewed plan v1", exact: true })
      .click();
    await expect(page).toHaveURL(/\/patient\/plan$/);
    const token = await demo.track(context);
    await page
      .getByRole("link", { name: "View update options", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Update my information", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Guided health intake", exact: true }),
    ).toBeVisible();
    const beforeNavigation = await demo.inspect(token);
    const steps = [
      ["Home", "Hello, Alex", /\/patient$/],
      ["Continue health intake", "Guided health intake", /\/patient\/intake$/],
      ["My plan", "Preventive follow-up", /\/patient\/plan$/],
      ["History", "Your follow-up history", /\/patient\/history$/],
      [/^View as physician/, "Review queue", /\/doctor$/],
      ["View finalized review", "Alex Example", /\/doctor\/reviews\//],
      ["Back to queue", "Review queue", /\/doctor$/],
      [/^View as patient/, "Hello, Alex", /\/patient$/],
    ] as const;
    for (let cycle = 0; cycle < 5; cycle++) {
      for (const [name, heading, route] of steps) {
        const start = performance.now();
        await page
          .getByRole("link", { name, exact: typeof name === "string" })
          .filter({ visible: true })
          .first()
          .click();
        await expect(page).toHaveURL(route);
        await expect(
          page.getByRole("heading", { level: 1, name: heading, exact: true }),
        ).toBeVisible();
        await expect(page.locator("#demo-case-title")).toHaveText(
          "Demo case: Alex Example",
        );
        const ms = performance.now() - start;
        timings.push({
          route: new URL(page.url()).pathname,
          ms: Math.round(ms),
          at: Date.now(),
        });
        expect(serverLog).not.toMatch(/P2028|Unable to start a transaction/);
        expect(errors).toEqual([]);
        expect
          .soft(ms, `${timings.at(-1)?.route}, cycle ${cycle + 1}`)
          .toBeLessThan(2500);
        // Model the presenter pause while video capture remains active; exclude it from latency.
        await page.waitForTimeout(2000);
      }
    }
    expect(serverLog).not.toMatch(/P2028|Unable to start a transaction/);
    expect(errors).toEqual([]);
    expect(await demo.inspect(token)).toEqual(beforeNavigation);
  } finally {
    info.annotations.push({
      type: "navigation timings",
      description: JSON.stringify(timings),
    });
    console.info("Navigation timings:", JSON.stringify(timings));
    if (server.exitCode === null && server.signalCode === null) {
      const exited = once(server, "exit");
      server.kill();
      await exited;
    }
  }
});
