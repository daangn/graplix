import { isGraplixDirectTypes, parse } from "@graplix/language";

import type {
  ResolvedRelationDefinition,
  ResolvedSchema,
  ResolvedTypeDefinition,
} from "./ResolvedSchema";

export async function resolveSchema(schema: string): Promise<ResolvedSchema> {
  const document = await parse(schema);
  const diagnostics = document.diagnostics ?? [];

  if (diagnostics.length > 0) {
    const messages = diagnostics.map((item) => item.message).join("\n");
    throw new Error(`Invalid Graplix schema:\n${messages}`);
  }

  const types = new Map<string, ResolvedTypeDefinition>();
  const root = document.parseResult?.value;

  if (root === undefined) {
    throw new Error("Invalid Graplix schema: missing parse root.");
  }

  for (const typeDeclaration of root.types) {
    const relations = new Map<string, ResolvedRelationDefinition>();

    for (const relation of typeDeclaration.relations?.relations ?? []) {
      const directTargetTypes = new Set<string>();

      for (const term of relation.expression.terms) {
        if (isGraplixDirectTypes(term)) {
          for (const target of term.targets) {
            directTargetTypes.add(target);
          }
        }
      }

      relations.set(relation.name, {
        terms: relation.expression.terms,
        directTargetTypes,
      });
    }

    types.set(typeDeclaration.name, { relations });
  }

  return { types };
}
