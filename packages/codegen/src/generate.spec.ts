import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import { generateTypeScript, generateTypeScriptFromFile } from "./generate";

const schema = `
  type user

  type repository
    relations
      define owner: [user]
`;

const relationSchema = `
  type user

  type team
    relations
      define member: [user]

  type repository
    relations
      define team: [team]
      define viewer: member from team
`;

describe("generateTypeScript", () => {
  test("generates base helper types from schema", async () => {
    const result = await generateTypeScript({ schema });

    expect(result.fileName).toBe("graplix.generated.ts");
    expect(result.content).toContain(
      'export type GraplixTypeName = "user" | "repository";',
    );
    expect(result.content).toContain("user: unknown;");
    expect(result.content).toContain("repository: unknown;");
    expect(result.content).toContain('repository: "owner";');
    expect(result.content).toContain(
      "export interface GraplixRelationTargetTypeNamesByType {",
    );
    expect(result.content).toContain("const graplix = String.raw;");
    expect(result.content).toContain("export const schema = graplix`");
    expect(result.content).toContain("\n    type user\n");
    expect(result.content).toContain('owner: "user";');
    expect(result.content).toContain(
      "export type GraplixResolveTypeValue = unknown;",
    );
    expect(result.content).toContain("value: GraplixResolveTypeValue,");
    expect(result.content).toContain("export function createEngine");
  });

  test("supports mapper imports and mapper type binding", async () => {
    const result = await generateTypeScript({
      schema,
      mappers: {
        user: "./models#UserModel",
        repository: "./models#RepositoryModel",
      },
    });

    expect(result.content).toContain(
      'import type { UserModel as Mapper_user } from "./models";',
    );
    expect(result.content).toContain(
      'import type { RepositoryModel as Mapper_repository } from "./models";',
    );
    expect(result.content).toContain("user: Mapper_user;");
    expect(result.content).toContain("repository: Mapper_repository;");
    expect(result.content).toContain(
      "export type GraplixResolveTypeValue = GraplixProvidedMapperTypes[keyof GraplixProvidedMapperTypes];",
    );
  });

  test("infers relation target types across source relations", async () => {
    const result = await generateTypeScript({ schema: relationSchema });

    expect(result.content).toContain("repository: {");
    expect(result.content).toContain('viewer: "user";');
    expect(result.content).toContain(
      "keyof GraplixRelationTargetTypeNamesByType[TTypeName]",
    );
  });

  test("generates from .graplix file path", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "graplix-codegen-"));
    const schemaPath = join(tempDir, "sample.graplix");
    await writeFile(schemaPath, schema, "utf8");

    const result = await generateTypeScriptFromFile({
      schemaFilePath: schemaPath,
      mappers: {
        user: "./domain#User",
      },
    });

    expect(result.fileName).toBe("sample.generated.ts");
    expect(result.content).toContain("export const schema = graplix`");
    expect(result.content).toContain("user: Mapper_user;");
  });
});
