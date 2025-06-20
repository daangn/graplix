import type { BaseEntityTypeMap } from "BaseEntityTypeMap";
import type { GraplixDirectlyRelatedUserTypes } from "GraplixSchema";
import type { ValidatedRelationMetadata } from "language/ValidatedModel";

export function getDirectlyRelatedUserTypes<T extends BaseEntityTypeMap>(
  relation: ValidatedRelationMetadata,
): GraplixDirectlyRelatedUserTypes<T> | undefined {
  const relationDef = relation.directly_related_user_types?.[0];
  if (!relationDef) return undefined;

  return {
    type: relationDef.type as Extract<keyof T, string>,
  };
}
