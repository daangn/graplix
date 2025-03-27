import { transformer } from "@openfga/syntax-transformer";
import type { BaseEntityTypeMap } from "BaseEntityTypeMap";
import type {
  GraplixSchema,
  GraplixSchemaRelationDefinition,
} from "../GraplixSchema";
import type { ValidatedRelationMetadata } from "./ValidatedModel";
import { validate } from "./validate";

type GraplixSchemaEntry<T extends BaseEntityTypeMap> = [
  string,
  { [relationName: string]: GraplixSchemaRelationDefinition<T> },
];

export function parse<T extends BaseEntityTypeMap>(
  input: string,
): GraplixSchema<T> {
  const schemaEntries: GraplixSchemaEntry<T>[] = [];
  const ast = transformer.transformDSLToJSONObject(input);

  validate(ast);

  for (const typeDefinition of ast.type_definitions) {
    const typeDef: {
      [relationName: string]: GraplixSchemaRelationDefinition<T>;
    } = {};

    for (const [relationName, relation] of Object.entries(
      typeDefinition.metadata?.relations ?? {},
    )) {
      const relationDef = getDirectlyRelatedUserTypes<T>(relation);
      if (relationDef) {
        typeDef[relationName] = relationDef;
      }
    }

    schemaEntries.push([typeDefinition.type, typeDef]);
  }

  return Object.fromEntries(schemaEntries) as GraplixSchema<T>;
}

function getDirectlyRelatedUserTypes<T extends BaseEntityTypeMap>(
  relation: ValidatedRelationMetadata,
): GraplixSchemaRelationDefinition<T> | undefined {
  const relationDef = relation.directly_related_user_types?.[0];
  if (!relationDef) return undefined;

  return {
    type: relationDef.type as Extract<keyof T, string>,
  } satisfies GraplixSchemaRelationDefinition<T>;
}
