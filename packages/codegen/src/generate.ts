import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import {
  isGraplixDirectTypes,
  isGraplixRelationFrom,
  parse,
} from "@graplix/language";

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
  readonly requiredResolverRelationNamesByType: ReadonlyMap<
    string,
    readonly string[]
  >;
  readonly relationResolverTargetTypeNamesByType: ReadonlyMap<
    string,
    ReadonlyMap<string, readonly string[]>
  >;
  readonly relationTargetTypeNamesByType: ReadonlyMap<
    string,
    ReadonlyMap<string, readonly string[]>
  >;
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

function emitRelationTargetNameType(
  relationName: string,
  targetTypeNames: readonly string[],
): string {
  if (targetTypeNames.length === 0) {
    return `    ${relationName}: never;`;
  }

  const targetUnion = targetTypeNames.map((item) => `"${item}"`).join(" | ");
  return `    ${relationName}: ${targetUnion};`;
}

function emitRequiredRelationNamesByType(
  typeName: string,
  requiredRelationNames: readonly string[],
): string {
  if (requiredRelationNames.length === 0) {
    return `  ${typeName}: never;`;
  }

  const requiredRelationUnion = requiredRelationNames
    .map((item) => `"${item}"`)
    .join(" | ");

  return `  ${typeName}: ${requiredRelationUnion};`;
}

function escapeTemplateLiteral(input: string): string {
  return input.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function toSchemaTemplateLiteral(schema: string): string {
  const normalized = schema.replace(/\r\n/g, "\n").trimEnd();
  const indented = normalized
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");

  return `\n${escapeTemplateLiteral(indented)}\n`;
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
  const requiredResolverRelationNamesByType = new Map<
    string,
    readonly string[]
  >();
  const relationDirectTargetTypeNamesByType = new Map<
    string,
    Map<string, readonly string[]>
  >();
  const relationResolverTargetTypeNamesByType = new Map<
    string,
    Map<string, readonly string[]>
  >();
  const relationTermsByType = new Map<
    string,
    Map<string, readonly unknown[]>
  >();

  for (const typeDeclaration of root.types) {
    typeNames.push(typeDeclaration.name);

    const relationDefinitions = typeDeclaration.relations?.relations ?? [];
    const relationNames = relationDefinitions.map((relation) => relation.name);
    const requiredRelationNames: string[] = [];
    const directTargetTypeNamesByRelation = new Map<
      string,
      readonly string[]
    >();
    const relationTermsByName = new Map<string, readonly unknown[]>();

    for (const relationDefinition of relationDefinitions) {
      relationTermsByName.set(
        relationDefinition.name,
        relationDefinition.expression.terms,
      );

      const directTargetTypeNames = relationDefinition.expression.terms
        .filter(isGraplixDirectTypes)
        .flatMap((term) => term.targets);

      if (relationDefinition.expression.terms.some(isGraplixDirectTypes)) {
        requiredRelationNames.push(relationDefinition.name);
      }

      directTargetTypeNamesByRelation.set(
        relationDefinition.name,
        directTargetTypeNames,
      );
    }

    relationTermsByType.set(typeDeclaration.name, relationTermsByName);
    relationDirectTargetTypeNamesByType.set(
      typeDeclaration.name,
      directTargetTypeNamesByRelation,
    );
    relationResolverTargetTypeNamesByType.set(
      typeDeclaration.name,
      directTargetTypeNamesByRelation,
    );
    requiredResolverRelationNamesByType.set(
      typeDeclaration.name,
      requiredRelationNames,
    );

    relationNamesByType.set(typeDeclaration.name, relationNames);
  }

  const relationTargetTypeNamesByType = new Map<
    string,
    Map<string, string[]>
  >();
  const relationTargetTypeNameCache = new Map<string, readonly string[]>();

  const getDirectTargetTypeNames = (
    typeName: string,
    relationName: string,
  ): readonly string[] => {
    return (
      relationDirectTargetTypeNamesByType.get(typeName)?.get(relationName) ?? []
    );
  };

  const pushUnique = (collection: string[], value: string): void => {
    if (!collection.includes(value)) {
      collection.push(value);
    }
  };

  const resolveTargetTypeNames = (
    typeName: string,
    relationName: string,
    path: ReadonlySet<string>,
  ): readonly string[] => {
    const cacheKey = `${typeName}:${relationName}`;
    const cached = relationTargetTypeNameCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    if (path.has(cacheKey)) {
      return [];
    }

    const relationTerms = relationTermsByType.get(typeName)?.get(relationName);
    if (relationTerms === undefined) {
      relationTargetTypeNameCache.set(cacheKey, []);
      return [];
    }

    const nextPath = new Set(path);
    nextPath.add(cacheKey);

    const targetTypeNames: string[] = [];

    for (const term of relationTerms) {
      if (isGraplixDirectTypes(term)) {
        for (const targetTypeName of term.targets) {
          pushUnique(targetTypeNames, targetTypeName);
        }
        continue;
      }

      if (!isGraplixRelationFrom(term)) {
        continue;
      }

      if (term.source === undefined) {
        const nestedTargetTypeNames = resolveTargetTypeNames(
          typeName,
          term.relation,
          nextPath,
        );

        for (const targetTypeName of nestedTargetTypeNames) {
          pushUnique(targetTypeNames, targetTypeName);
        }

        continue;
      }

      const sourceTargetTypeNames = getDirectTargetTypeNames(
        typeName,
        term.source,
      );
      for (const sourceTypeName of sourceTargetTypeNames) {
        const nestedTargetTypeNames = resolveTargetTypeNames(
          sourceTypeName,
          term.relation,
          nextPath,
        );

        for (const targetTypeName of nestedTargetTypeNames) {
          pushUnique(targetTypeNames, targetTypeName);
        }
      }
    }

    relationTargetTypeNameCache.set(cacheKey, targetTypeNames);
    return targetTypeNames;
  };

  for (const typeName of typeNames) {
    const relationNames = relationNamesByType.get(typeName) ?? [];
    const relationTargetTypeNamesByRelation = new Map<string, string[]>();

    for (const relationName of relationNames) {
      relationTargetTypeNamesByRelation.set(relationName, [
        ...resolveTargetTypeNames(typeName, relationName, new Set()),
      ]);
    }

    relationTargetTypeNamesByType.set(
      typeName,
      relationTargetTypeNamesByRelation,
    );
  }

  return {
    typeNames,
    relationNamesByType,
    requiredResolverRelationNamesByType,
    relationResolverTargetTypeNamesByType,
    relationTargetTypeNamesByType,
  };
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

  const relationTargetEntries = parsedSchema.typeNames
    .map((typeName) => {
      const relationNames =
        parsedSchema.relationNamesByType.get(typeName) ?? [];
      if (relationNames.length === 0) {
        return `  ${typeName}: {};`;
      }

      const relationTargetTypeEntries = relationNames
        .map((relationName) => {
          const targetTypeNames =
            parsedSchema.relationTargetTypeNamesByType
              .get(typeName)
              ?.get(relationName) ?? [];
          return emitRelationTargetNameType(relationName, targetTypeNames);
        })
        .join("\n");

      return `  ${typeName}: {\n${relationTargetTypeEntries}\n  };`;
    })
    .join("\n");

  const requiredRelationEntries = parsedSchema.typeNames
    .map((typeName) => {
      const requiredRelationNames =
        parsedSchema.requiredResolverRelationNamesByType.get(typeName) ?? [];
      return emitRequiredRelationNamesByType(typeName, requiredRelationNames);
    })
    .join("\n");

  const resolverRelationTargetEntries = parsedSchema.typeNames
    .map((typeName) => {
      const relationNames =
        parsedSchema.relationNamesByType.get(typeName) ?? [];
      if (relationNames.length === 0) {
        return `  ${typeName}: {};`;
      }

      const resolverRelationTargetTypeEntries = relationNames
        .map((relationName) => {
          const targetTypeNames =
            parsedSchema.relationResolverTargetTypeNamesByType
              .get(typeName)
              ?.get(relationName) ?? [];
          return emitRelationTargetNameType(relationName, targetTypeNames);
        })
        .join("\n");

      return `  ${typeName}: {\n${resolverRelationTargetTypeEntries}\n  };`;
    })
    .join("\n");

  const providedMapperEntries = parsedSchema.typeNames
    .filter((typeName) => mappers[typeName] !== undefined)
    .map((typeName) => `  ${typeName}: ${mapperTypeFor(typeName, mappers)};`)
    .join("\n");

  const resolveTypeValue =
    providedMapperEntries.length === 0
      ? "unknown"
      : "GraplixProvidedMapperTypes[keyof GraplixProvidedMapperTypes]";
  const schemaLiteral = toSchemaTemplateLiteral(options.schema);

  const content = `${mapperImports}import {
  buildEngine as buildBaseEngine,
  type GraplixEngine,
  type ResolverInfo,
} from "@graplix/engine";

const graplix = String.raw;

export const schema = graplix\`${schemaLiteral}\`;

export type GraplixTypeName = ${typeNameUnion};

export type GraplixEntityKey<TTypeName extends GraplixTypeName = GraplixTypeName> = \
\`\${TTypeName}:\${string}\`;

export interface GraplixMapperTypes {
${mapperEntries}
}

export interface GraplixRelationNamesByType {
${relationEntries}
}

export interface GraplixRelationTargetTypeNamesByType {
${relationTargetEntries}
}

export interface GraplixRequiredResolverRelationNamesByType {
${requiredRelationEntries}
}

export interface GraplixResolverRelationTargetTypeNamesByType {
${resolverRelationTargetEntries}
}

export interface GraplixProvidedMapperTypes {
${providedMapperEntries}
}

export type GraplixEntityInput = GraplixProvidedMapperTypes[keyof GraplixProvidedMapperTypes];

export type GraplixResolveTypeValue = ${resolveTypeValue};

export type GraplixRelationResolverValue<TTypeName extends GraplixTypeName> =
  GraplixMapperTypes[TTypeName];

export type GraplixRelationResolverResult<TTypeName extends GraplixTypeName> =
  | GraplixRelationResolverValue<TTypeName>
  | ReadonlyArray<GraplixRelationResolverValue<TTypeName>>
  | null;

export type GraplixRelationTargetTypeName<
  TTypeName extends GraplixTypeName,
  TRelationName extends keyof GraplixRelationTargetTypeNamesByType[TTypeName],
> = Extract<
  GraplixRelationTargetTypeNamesByType[TTypeName][TRelationName],
  GraplixTypeName
>;

export type GraplixResolverRelationTargetTypeName<
  TTypeName extends GraplixTypeName,
  TRelationName extends keyof GraplixResolverRelationTargetTypeNamesByType[TTypeName],
> = Extract<
  GraplixResolverRelationTargetTypeNamesByType[TTypeName][TRelationName],
  GraplixTypeName
>;

export type GraplixResolverRelations<
  TTypeName extends GraplixTypeName,
  TContext = object,
> = {
  [TRelationName in keyof GraplixResolverRelationTargetTypeNamesByType[
    TTypeName
  ] as TRelationName extends
    GraplixRequiredResolverRelationNamesByType[TTypeName]
    ? TRelationName
    : never]: (
    entity: GraplixMapperTypes[TTypeName],
    context: TContext,
    info: ResolverInfo,
  ) =>
    | GraplixRelationResolverResult<
      GraplixResolverRelationTargetTypeName<TTypeName, TRelationName>
    >
    | Promise<
      GraplixRelationResolverResult<
        GraplixResolverRelationTargetTypeName<TTypeName, TRelationName>
      >
    >;
};

export type GraplixResolvers<TContext = object> = {
  [TTypeName in GraplixTypeName]: {
    id(entity: GraplixMapperTypes[TTypeName]): string;
    load(id: string, context: TContext, info: ResolverInfo): Promise<GraplixMapperTypes[TTypeName] | null>;
    relations?: GraplixResolverRelations<TTypeName, TContext>;
  };
};

export type GraplixResolveType<TContext = object> = (
  value: GraplixResolveTypeValue,
  context: TContext,
) => GraplixTypeName | null;

export interface BuildEngineOptions<TContext = object> {
  readonly resolvers: GraplixResolvers<TContext>;
  readonly resolveType: GraplixResolveType<TContext>;
};

export async function buildEngine<TContext = object>(
  options: BuildEngineOptions<TContext>,
): Promise<GraplixEngine<TContext, GraplixEntityInput>> {
  return buildBaseEngine<TContext, GraplixEntityInput>({
    schema,
    resolvers: options.resolvers,
    resolveType: (value, context) =>
      options.resolveType(value as GraplixResolveTypeValue, context),
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
