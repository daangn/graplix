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

const aliasOnlyRelationSchema = `
  type user

  type team
    relations
      define member: [user]

  type repository
    relations
      define owner: [user]
      define viewer: owner
`;

const orUnionRelationSchema = `
  type user

  type team
    relations
      define member: [user]

  type organization
    relations
      define owner: [user]

  type repository
    relations
      define team: [team]
      define organization: [organization]
      define admin: organization or team
      define access: team or organization
`;

const orAliasOnlyRelationSchema = `
  type user

  type organization
    relations
      define owner: [user]

  type repository
    relations
      define owner: [user]
      define org: [organization]
      define combined: owner or org
`;

const orMixedResolverOnlySchema = `
  type user

  type organization
    relations
      define owner: [user]

  type repository
    relations
      define owner: [user]
      define org: [organization]
      define combined: owner or org or [user]
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

    const tag = "graplix";
    expect(result.content).toContain(`export const schema = ${tag}\``);
    expect(result.content).toContain("\n    type user\n");
    expect(result.content).toContain('owner: "user";');
    expect(result.content).toContain(
      "export type GraplixResolveTypeValue = unknown;",
    );
    expect(result.content).toContain("value: GraplixResolveTypeValue,");
    expect(result.content).toContain("export function createEngine");
    expect(result.content).toContain(
      "export type GraplixEntityInput = GraplixProvidedMapperTypes[keyof GraplixProvidedMapperTypes];",
    );
    expect(result.content).toContain(
      "): GraplixEngine<TContext, GraplixEntityInput> {",
    );
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
    expect(result.content).toContain(
      "export type GraplixEntityInput = GraplixProvidedMapperTypes[keyof GraplixProvidedMapperTypes];",
    );
    expect(result.content).toContain(
      "): GraplixEngine<TContext, GraplixEntityInput> {",
    );
  });

  test("does not expose resolver for alias-only relations", async () => {
    const result = await generateTypeScript({
      schema: aliasOnlyRelationSchema,
    });

    expect(result.content).toContain('  repository: "owner" | "viewer";');
    expect(result.content).toContain('  repository: "owner";');
    expect(result.content).toContain("export type GraplixResolverRelations<");
    expect(result.content).not.toContain("[TRelationName in Exclude<");
  });

  test("requires resolver for OR relations with direct targets", async () => {
    const result = await generateTypeScript({ schema: orUnionRelationSchema });

    expect(result.content).toContain(
      '  repository: "team" | "organization" | "admin" | "access";',
    );
    expect(result.content).toContain('    admin: "organization" | "team";');
    expect(result.content).toContain('    access: "team" | "organization";');
  });

  test("keeps OR alias-only relations out of resolver contracts", async () => {
    const result = await generateTypeScript({
      schema: orAliasOnlyRelationSchema,
    });

    expect(result.content).toContain('  repository: "owner" | "org";');
    expect(result.content).toContain('    combined: "user" | "organization";');
    expect(result.content).toContain(
      '  repository: "owner" | "org" | "combined";',
    );

    const requiredSection =
      result.content
        .split(
          "export interface GraplixRequiredResolverRelationNamesByType {",
        )[1]
        ?.split("export interface GraplixProvidedMapperTypes")[0] ?? "";

    expect(requiredSection).toContain('  repository: "owner" | "org";');
    expect(requiredSection).not.toContain(
      '  repository: "owner" | "org" | "combined";',
    );
  });

  test("uses direct relation targets for OR resolver return types", async () => {
    const result = await generateTypeScript({
      schema: orMixedResolverOnlySchema,
    });

    expect(result.content).toContain('    combined: "user" | "organization";');

    const resolverTargetSection =
      result.content
        .split(
          "export interface GraplixResolverRelationTargetTypeNamesByType {",
        )[1]
        ?.split("export interface GraplixProvidedMapperTypes")[0] ?? "";

    expect(resolverTargetSection).toContain("  repository: {");
    expect(resolverTargetSection).toContain('    owner: "user";');
    expect(resolverTargetSection).toContain('    org: "organization";');
    expect(resolverTargetSection).toContain('    combined: "user";');
    expect(resolverTargetSection).not.toContain(
      '    combined: "user" | "organization";',
    );

    const requiredSection =
      result.content
        .split(
          "export interface GraplixRequiredResolverRelationNamesByType {",
        )[1]
        ?.split(
          "export interface GraplixResolverRelationTargetTypeNamesByType",
        )[0] ?? "";

    expect(requiredSection).toContain(
      '  repository: "owner" | "org" | "combined";',
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

    const tag = "graplix";
    expect(result.content).toContain(`export const schema = ${tag}\``);
    expect(result.content).toContain("user: Mapper_user;");
  });
});
