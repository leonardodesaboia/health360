import { readFile } from "node:fs/promises";

// Usage: codex mcp list --json | node scripts/check-codex-mcp.mjs
// Codex parses TOML and resolves configuration; don't maintain a partial TOML parser.
try {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  const actual = JSON.parse(input.replace(/^\uFEFF/, ""));
  const { mcpServers } = JSON.parse(
    await readFile(new URL("../.mcp.json", import.meta.url), "utf8"),
  );
  if (!Array.isArray(actual) || !mcpServers)
    throw new Error("Expected Codex JSON list and project mcpServers");
  for (const [name, expected] of Object.entries(mcpServers)) {
    const server = actual.find((entry) => entry.name === name);
    if (
      !server?.enabled ||
      server.transport?.type !== "stdio" ||
      server.transport.command !== expected.command ||
      JSON.stringify(server.transport.args) !== JSON.stringify(expected.args)
    ) {
      throw new Error(
        `Codex MCP mismatch for ${name}; compare .mcp.json and .codex/config.toml, and confirm project trust`,
      );
    }
  }
  console.log(
    `Codex MCP parity passed: ${Object.keys(mcpServers).length} project servers. Additional user servers are allowed.`,
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
