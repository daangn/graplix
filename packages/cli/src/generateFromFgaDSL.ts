import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "graplix";
import { generateEntityScaffold } from "./generateEntityScaffold.ts";
import { generateSchemaFile } from "./generateSchemaFile.ts";

export function generateFromFgaDsl(dsl: string, outDir = "__generated__") {
  const model = parse(dsl);
  const typeNames = Object.keys(model);

  mkdirSync(outDir, { recursive: true });

  writeFileSync(path.join(outDir, "schema.ts"), generateSchemaFile(model));
  writeFileSync(
    path.join(outDir, "entity.ts"),
    generateEntityScaffold(typeNames),
  );
}
