import {
  lstat,
  mkdir,
  readFile,
  readdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const manifestName = ".health360-skills.json";

async function exists(file) {
  try {
    return await lstat(file);
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

// Reject links/junctions in every component before reading, writing, or deleting.
async function confined(root, relative) {
  const parts = relative.split("/");
  if (
    parts.some(
      (part) => !part || part === "." || part === ".." || /[\\:]/.test(part),
    )
  ) {
    throw new Error(`Unsafe skill path: ${relative}`);
  }
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    if ((await exists(current))?.isSymbolicLink()) {
      throw new Error(`Skill paths must not contain links: ${current}`);
    }
  }
  return current;
}

async function filesIn(root, relative) {
  const directory = await confined(root, relative);
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const child = `${relative}/${entry.name}`;
    await confined(root, child);
    if (entry.isDirectory()) files.push(...(await filesIn(root, child)));
    else if (entry.isFile()) files.push(child);
    else throw new Error(`Unsupported skill entry: ${child}`);
  }
  return files.sort();
}

export async function syncSkills(root, { check = false } = {}) {
  root = path.resolve(root);
  const source = ".claude/skills";
  const destination = ".agents/skills";
  const sourceFiles = await filesIn(root, source); // Missing canonical source is an error.
  if (!sourceFiles.some((file) => file.endsWith("/SKILL.md"))) {
    throw new Error("Canonical skills must contain at least one SKILL.md");
  }
  const expected = new Map();
  for (const file of sourceFiles) {
    const relative = file.slice(source.length + 1);
    if (!relative.includes("/"))
      throw new Error(`Expected skill folders, found: ${file}`);
    expected.set(relative, await readFile(await confined(root, file)));
  }
  for (const relative of expected.keys()) {
    const skill = relative.split("/")[0];
    if (!expected.has(`${skill}/SKILL.md`))
      throw new Error(`Missing SKILL.md: ${skill}`);
  }
  const manifestPath = await confined(root, `${destination}/${manifestName}`);
  const previous = (await exists(manifestPath))
    ? JSON.parse(await readFile(manifestPath, "utf8"))
    : [];
  if (
    !Array.isArray(previous) ||
    previous.some((file) => typeof file !== "string" || !file.includes("/"))
  ) {
    throw new Error("Invalid skills manifest");
  }
  const writes = [];
  const removals = [];
  const managedSkills = new Set(
    [...previous, ...expected.keys()].map((file) => file.split("/")[0]),
  );
  for (const skill of managedSkills) {
    const relative = `${destination}/${skill}`;
    if (await exists(await confined(root, relative))) {
      for (const file of await filesIn(root, relative)) {
        const name = file.slice(destination.length + 1);
        if (!previous.includes(name) && !expected.has(name)) {
          throw new Error(`Unmanaged file inside mirrored skill: ${name}`);
        }
      }
    }
  }
  for (const [relative, contents] of expected) {
    const target = await confined(root, `${destination}/${relative}`);
    const actual = (await exists(target)) ? await readFile(target) : undefined;
    if (!actual?.equals(contents)) {
      if (actual && !previous.includes(relative)) {
        throw new Error(`Refusing to overwrite unmanaged skill: ${relative}`);
      }
      writes.push([target, contents]);
    }
  }
  for (const relative of previous) {
    const target = await confined(root, `${destination}/${relative}`);
    if (!expected.has(relative) && (await exists(target)))
      removals.push(target);
  }
  const manifest = `${JSON.stringify([...expected.keys()].sort(), null, 2)}\n`;
  const manifestDrift =
    !(await exists(manifestPath)) ||
    JSON.stringify(previous) !== JSON.stringify([...expected.keys()].sort());
  if (check) {
    if (writes.length || removals.length || manifestDrift) {
      throw new Error(
        `Skill mirror drift: ${writes.length} changed/missing, ${removals.length} stale. Run pnpm skills:sync.`,
      );
    }
  } else {
    for (const [target, contents] of writes) {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, contents);
    }
    // Only individually listed generated files are removed; unrelated skills survive.
    for (const target of removals) await unlink(target);
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, manifest);
  }
  return expected.size;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check"))
    throw new Error("Usage: node scripts/sync-agent-skills.mjs [--check]");
  try {
    const count = await syncSkills(
      fileURLToPath(new URL("../", import.meta.url)),
      { check: args.includes("--check") },
    );
    console.log(
      `Skills ${args.includes("--check") ? "checked" : "synced"}: ${count} canonical files.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
