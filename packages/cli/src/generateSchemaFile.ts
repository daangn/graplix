import type { GraplixSchema } from "@daangn/graplix";
import { header } from "./header.ts";

export function generateSchemaFile(schema: GraplixSchema<any>): string {
  const lines = [
    ...header,
    'import type { GraplixSchema } from "@daangn/graplix";',
    'import type { GraplixGeneratedEntityTypes } from "./entity";',
    "",
    "export const schema: GraplixSchema<GraplixGeneratedEntityTypes> = {",
  ];

  const stringifiedSchema = JSON.stringify(schema, null, 2).slice(2, -2);
  lines.push(stringifiedSchema);

  lines.push("};");
  return lines.join("\n");
}
