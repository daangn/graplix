import { transformer } from "@openfga/syntax-transformer";
import type { BaseEntityTypeMap } from "../../BaseEntityTypeMap";
import type {
  GraplixSchema,
  GraplixSchemaRelationDefinition,
} from "../../GraplixSchema";
import { validate } from "../validate";
import { getDirectlyRelatedUserTypes } from "./getDirectlyRelatedUserTypes";
import { getUnionRelations } from "./getUnionRelations";

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

  for (const typeDefinition of ast.type_definitions ?? []) {
    const typeDef: {
      [relationName: string]: GraplixSchemaRelationDefinition<T>;
    } = {};

    for (const [relationName, relation] of Object.entries(
      typeDefinition.relations ?? {},
    )) {
      const computedSetRelations = getUnionRelations(relation);
      if (!computedSetRelations) continue;

      typeDef[relationName] = computedSetRelations;
    }

    for (const [relationName, relation] of Object.entries(
      typeDefinition.metadata?.relations ?? {},
    )) {
      const directlyRelatedUserTypes = getDirectlyRelatedUserTypes<T>(relation);
      if (!directlyRelatedUserTypes) continue;

      typeDef[relationName] = directlyRelatedUserTypes;
    }

    schemaEntries.push([typeDefinition.type, typeDef]);
  }

  return Object.fromEntries(schemaEntries) as GraplixSchema<T>;
}
