import { header } from "./header.ts";

export function generateEntityScaffold(typeNames: string[]): string {
  const lines = [
    ...header,
    'import { defineEntity } from "@daangn/graplix";',
    "",
    "export const entityDefinitions = {",
    ...typeNames.map(
      (t) =>
        `  ${t}: defineEntity("${t}", (/* TODO: add args */) => ({ /* TODO: add fields */ })),`,
    ),
    "};",
    "",
    "export type GraplixGeneratedEntityTypes = {",
    "  [K in keyof typeof entityDefinitions]: ReturnType<",
    "    (typeof entityDefinitions)[K]",
    ">;",
    "};",
  ];
  return lines.join("\n");
}
