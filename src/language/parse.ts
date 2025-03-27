import { transformer } from "@openfga/syntax-transformer";
import type { BaseEntityTypeMap } from "BaseEntityTypeMap";
import type {
  GraplixComputedSetRelationDefinition,
  GraplixDirectlyRelatedUserTypes,
  GraplixSchema,
  GraplixSchemaRelationDefinition,
} from "../GraplixSchema";
import type {
  ValidatedRelationMetadata,
  ValidatedUserset,
} from "./ValidatedModel";
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
      typeDefinition.relations ?? {},
    )) {
      const computedSetRelations = getComputedSetRelations(relation);
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

function getDirectlyRelatedUserTypes<T extends BaseEntityTypeMap>(
  relation: ValidatedRelationMetadata,
): GraplixDirectlyRelatedUserTypes<T> | undefined {
  const relationDef = relation.directly_related_user_types?.[0];
  if (!relationDef) return undefined;

  return {
    type: relationDef.type as Extract<keyof T, string>,
  };
}

function getComputedSetRelations(
  userSet: ValidatedUserset,
  computedUsersets: GraplixComputedSetRelationDefinition[] = [],
): GraplixComputedSetRelationDefinition[] {
  if (userSet.computedUserset?.relation) {
    computedUsersets.push({
      when: userSet.computedUserset.relation,
    });
  }

  if (userSet.union) {
    for (const child of userSet.union.child) {
      getComputedSetRelations(child, computedUsersets);
    }
  }

  return computedUsersets;
}
