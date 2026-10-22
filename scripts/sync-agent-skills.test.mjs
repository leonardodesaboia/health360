import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { syncSkills } from "./sync-agent-skills.mjs";

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "health360-skills-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const put = async (relative, contents) => {
    const file = path.join(root, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, contents);
  };
  await put(
    ".claude/skills/example/SKILL.md",
    "---\nname: example\ndescription: Example\n---\n",
  );
  return { root, put };
}

test("mirrors support assets, detects drift without writing, updates and removes only managed files", async (t) => {
  const { root, put } = await fixture(t);
  await put(".claude/skills/example/references/guide.md", "original");
  await put(".agents/skills/independent/SKILL.md", "independent");
  await syncSkills(root);
  await syncSkills(root, { check: true });
  await put(".claude/skills/example/references/guide.md", "updated");
  await assert.rejects(syncSkills(root, { check: true }), /drift/);
  assert.equal(
    await readFile(
      path.join(root, ".agents/skills/example/references/guide.md"),
      "utf8",
    ),
    "original",
  );
  await syncSkills(root);
  await rm(path.join(root, ".claude/skills/example/references/guide.md"));
  await syncSkills(root);
  await assert.rejects(
    readFile(path.join(root, ".agents/skills/example/references/guide.md")),
    { code: "ENOENT" },
  );
  assert.equal(
    await readFile(
      path.join(root, ".agents/skills/independent/SKILL.md"),
      "utf8",
    ),
    "independent",
  );
});

test("rejects unmanaged collisions before any writes", async (t) => {
  const { root, put } = await fixture(t);
  await put(".agents/skills/example/SKILL.md", "custom");
  await assert.rejects(syncSkills(root), /unmanaged/);
  assert.equal(
    await readFile(path.join(root, ".agents/skills/example/SKILL.md"), "utf8"),
    "custom",
  );
});

test("accepts Git CRLF conversion in the generated manifest", async (t) => {
  const { root, put } = await fixture(t);
  await syncSkills(root);
  const manifestPath = path.join(root, ".agents/skills/.health360-skills.json");
  const manifest = await readFile(manifestPath, "utf8");
  await put(
    ".agents/skills/.health360-skills.json",
    manifest.replaceAll("\n", "\r\n"),
  );
  await syncSkills(root, { check: true });
});

test("detects extra files inside a managed skill without deleting them", async (t) => {
  const { root, put } = await fixture(t);
  await syncSkills(root);
  await put(".agents/skills/example/extra.md", "local work");
  await assert.rejects(syncSkills(root, { check: true }), /Unmanaged file/);
  await assert.rejects(syncSkills(root), /Unmanaged file/);
  assert.equal(
    await readFile(path.join(root, ".agents/skills/example/extra.md"), "utf8"),
    "local work",
  );
});

test("rejects traversing manifest entries and missing or empty canonical source", async (t) => {
  const { root, put } = await fixture(t);
  await put(".agents/skills/.health360-skills.json", '["../../outside"]');
  await assert.rejects(syncSkills(root), /Unsafe/);
  await rm(path.join(root, ".claude/skills"), { recursive: true });
  await assert.rejects(syncSkills(root), { code: "ENOENT" });
  await mkdir(path.join(root, ".claude/skills"));
  await assert.rejects(syncSkills(root), /at least one/);
});

test("rejects destination junctions instead of writing outside the mirror", async (t) => {
  const { root } = await fixture(t);
  const external = await mkdtemp(
    path.join(os.tmpdir(), "health360-skills-external-"),
  );
  t.after(() => rm(external, { recursive: true, force: true }));
  await mkdir(path.join(root, ".agents"));
  await symlink(external, path.join(root, ".agents/skills"), "junction");
  await assert.rejects(syncSkills(root), /links/);
  await assert.rejects(readFile(path.join(external, "example/SKILL.md")), {
    code: "ENOENT",
  });
});
