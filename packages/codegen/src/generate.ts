import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";

import { parse } from "@graplix/language";

export type MapperConfig = Record<string, string>;

export interface GenerateTypeScriptOptions {
  readonly schema: string;
  readonly mappers?: MapperConfig;
  readonly fileName?: string;
}

export interface GenerateTypeScriptFromFileOptions {
  readonly schemaFilePath: string;
  readonly mappers?: MapperConfig;
}

export interface GenerateTypeScriptResult {
  readonly fileName: string;
  readonly content: string;
}

interface ParsedSchema {
  readonly typeNames: readonly string[];
  readonly relationNamesByType: ReadonlyMap<string, readonly string[]>;
}

interface MapperImportSpec {
  readonly modulePath: string;
  readonly importName: string;
  readonly alias: string;
}

function toGeneratedFileName(schemaFilePath: string): string {
  const schemaBaseName = basename(schemaFilePath);
  const schemaExt = extname(schemaBaseName);
  const base =
    schemaExt.length === 0
      ? schemaBaseName
      : schemaBaseName.slice(0, -schemaExt.length);
  return `${base}.generated.ts`;
}

function toMapperAlias(typeName: string): string {
  return `Mapper_${typeName.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

function parseMapperSpec(
  typeName: string,
  mapper: string,
): MapperImportSpec | undefined {
  const hashIndex = mapper.indexOf("#");
  if (hashIndex < 0) {
    return undefined;
  }

  const modulePath = mapper.slice(0, hashIndex).trim();
  const importName = mapper.slice(hashIndex + 1).trim();
  if (modulePath.length === 0 || importName.length === 0) {
    throw new Error(`Invalid mapper for type "${typeName}": ${mapper}`);
  }

  return {
    modulePath,
    importName,
    alias: toMapperAlias(typeName),
  };
}

function emitMapperImports(
  typeNames: readonly string[],
  mappers: MapperConfig,
): string {
  const imports: MapperImportSpec[] = [];

  for (const typeName of typeNames) {
    const mapper = mappers[typeName];
    if (mapper === undefined) {
      continue;
    }

    const spec = parseMapperSpec(typeName, mapper);
    if (spec !== undefined) {
      imports.push(spec);
    }
  }

  if (imports.length === 0) {
    return "";
  }

  const lines: string[] = [];
  for (const spec of imports) {
    if (spec.importName === "default") {
      lines.push(`import type ${spec.alias} from "${spec.modulePath}";`);
    } else {
      lines.push(
        `import type { ${spec.importName} as ${spec.alias} } from "${spec.modulePath}";`,
      );
    }
  }

  return `${lines.join("\n")}\n\n`;
}

function mapperTypeFor(typeName: string, mappers: MapperConfig): string {
  const mapper = mappers[typeName];
  if (mapper === undefined) {
    return "unknown";
  }

  const spec = parseMapperSpec(typeName, mapper);
  if (spec !== undefined) {
    return spec.alias;
  }

  return mapper;
}

function emitRelationNameType(
  typeName: string,
  relations: readonly string[],
): string {
  if (relations.length === 0) {
    return `  ${typeName}: never;`;
  }

  const relationUnion = relations.map((item) => `"${item}"`).join(" | ");
  return `  ${typeName}: ${relationUnion};`;
}

function escapeTemplateLiteral(input: string): string {
  return input.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

async function parseSchema(schema: string): Promise<ParsedSchema> {
  const document = await parse(schema);
  const diagnostics = document.diagnostics ?? [];

  if (diagnostics.length > 0) {
    const messages = diagnostics.map((item) => item.message).join("\n");
    throw new Error(`Invalid Graplix schema:\n${messages}`);
  }

  const root = document.parseResult?.value;
  if (root === undefined) {
    throw new Error("Invalid Graplix schema: missing parse root.");
  }

  const typeNames: string[] = [];
  const relationNamesByType = new Map<string, readonly string[]>();

  for (const typeDeclaration of root.types) {
    typeNames.push(typeDeclaration.name);

    const relationNames = (typeDeclaration.relations?.relations ?? []).map(
      (relation) => relation.name,
    );

    relationNamesByType.set(typeDeclaration.name, relationNames);
  }

  return { typeNames, relationNamesByType };
}

export async function generateTypeScript(
  options: GenerateTypeScriptOptions,
): Promise<GenerateTypeScriptResult> {
  const parsedSchema = await parseSchema(options.schema);
  const mappers = options.mappers ?? {};
  const fileName = options.fileName ?? "graplix.generated.ts";

  if (parsedSchema.typeNames.length === 0) {
    throw new Error("Schema must contain at least one type.");
  }

  const mapperImports = emitMapperImports(parsedSchema.typeNames, mappers);
  const typeNameUnion = parsedSchema.typeNames
    .map((typeName) => `"${typeName}"`)
    .join(" | ");

  const mapperEntries = parsedSchema.typeNames
    .map((typeName) => `  ${typeName}: ${mapperTypeFor(typeName, mappers)};`)
    .join("\n");

  const relationEntries = parsedSchema.typeNames
    .map((typeName) => {
      const relationNames =
        parsedSchema.relationNamesByType.get(typeName) ?? [];
      return emitRelationNameType(typeName, relationNames);
    })
    .join("\n");

  const content = `${mapperImports}import {
  createEngine,
  type GraplixEngine,
  type ResolveType,
  type Resolver,
} from "@graplix/engine";

export const schema = String.raw\`${escapeTemplateLiteral(options.schema)}\`;

export type GraplixTypeName = ${typeNameUnion};

export type GraplixEntityKey<TTypeName extends GraplixTypeName = GraplixTypeName> = \
\`\${TTypeName}:\${string}\`;

export interface GraplixMapperTypes {
${mapperEntries}
}

export interface GraplixRelationNamesByType {
${relationEntries}
}

export type GraplixResolvers<TContext = object> = {
  [TTypeName in GraplixTypeName]: Resolver<GraplixMapperTypes[TTypeName], TContext>;
};

export interface CreateGeneratedEngineOptions<TContext = object> {
  readonly resolvers: GraplixResolvers<TContext>;
  readonly resolveType: ResolveType<TContext>;
}

export function createGeneratedEngine<TContext = object>(
  options: CreateGeneratedEngineOptions<TContext>,
): GraplixEngine<TContext> {
  return createEngine({
    schema,
    resolvers: options.resolvers,
    resolveType: options.resolveType,
  });
}
`;

  return {
    fileName,
    content,
  };
}

export async function generateTypeScriptFromFile(
  options: GenerateTypeScriptFromFileOptions,
): Promise<GenerateTypeScriptResult> {
  const schema = await readFile(options.schemaFilePath, "utf8");
  return generateTypeScript({
    schema,
    mappers: options.mappers,
    fileName: toGeneratedFileName(options.schemaFilePath),
  });
}
