import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { conditions: ["react-server"] },
  test: {
    environment: "node",
    setupFiles: ["./tests/server-only.ts"],
    include: ["src/**/*.test.ts"],
  },
});
