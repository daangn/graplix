import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const PACKAGES_DIR = resolve(REPO_ROOT, "packages");
const DOCS_OUT = resolve(PACKAGES_DIR, "engine/dist/docs");

const SOURCES: Array<{ src: string; dest: string }> = [
  {
    src: resolve(PACKAGES_DIR, "engine/README.md"),
    dest: resolve(DOCS_OUT, "engine.md"),
  },
  {
    src: resolve(PACKAGES_DIR, "language/README.md"),
    dest: resolve(DOCS_OUT, "language.md"),
  },
  {
    src: resolve(PACKAGES_DIR, "codegen/README.md"),
    dest: resolve(DOCS_OUT, "codegen.md"),
  },
];

async function main() {
  let distExists = true;
  try {
    await readdir(resolve(PACKAGES_DIR, "engine/dist"));
  } catch {
    distExists = false;
  }

  if (!distExists) {
    console.warn(
      "Skipping docs generation: packages/engine/dist/ not found. Run `yarn workspace @graplix/engine build` first.",
    );
    return;
  }

  await mkdir(DOCS_OUT, { recursive: true });

  let count = 0;
  for (const { src, dest } of SOURCES) {
    try {
      await copyFile(src, dest);
      console.log(`  ${src.replace(REPO_ROOT + "/", "")} → ${dest.replace(REPO_ROOT + "/", "")}`);
      count++;
    } catch {
      console.warn(`  Skipping ${src.replace(REPO_ROOT + "/", "")} — not found`);
    }
  }

  console.log(`\nGenerated ${count} docs in packages/engine/dist/docs/`);
}

main().catch((error) => {
  console.error("Failed to generate docs:", error);
  process.exit(1);
});
