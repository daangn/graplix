import type { RelationReference, TypeDefinition, Userset } from "@openfga/sdk";
import type { transformer } from "@openfga/syntax-transformer";
import { ExceptionCollector } from "../utils/exceptions";
import { UnimplementedError, type UnimplementedSingleError } from "./errors";

export function validate(
  model: ReturnType<typeof transformer.transformDSLToJSONObject>,
): void {
  const errors: UnimplementedSingleError[] = [];
  const collector = new ExceptionCollector(errors);

  // NOTE: Not planning to support conditions anytime soon
  if (model.conditions) {
    collector.raiseUnimplementedError("Conditions");
  }

  for (const typeDef of model.type_definitions) {
    validateTypeDef({ typeDef, collector });
  }

  if (errors.length > 0) {
    throw new UnimplementedError(errors);
  }
}

function validateTypeDef({
  typeDef,
  collector,
}: {
  typeDef: TypeDefinition;
  collector: ExceptionCollector;
}): void {
  const directlyRelatedUserTypes = getDirectlyRelatedUserTypes(typeDef);
  if (directlyRelatedUserTypes.length > 1) {
    collector.raiseUnimplementedError("Multiple directly related user types");
  }

  if (hasAndOperator(typeDef)) {
    collector.raiseUnimplementedError("and operator");
  }

  if (hasButNotOperator(typeDef)) {
    collector.raiseUnimplementedError("but not operator");
  }

  if (hasTypeRestrictionRelation(typeDef)) {
    collector.raiseUnimplementedError("type restriction relation");
  }

  if (hasTypeRestrictionWildcard(typeDef)) {
    collector.raiseUnimplementedError("type restriction wildcard");
  }
}

/**
 *  get `directly_related_user_types` from `TypeDefinition`
 */
function getDirectlyRelatedUserTypes(
  typeDefinition: TypeDefinition,
): RelationReference[] {
  if (!typeDefinition.metadata) {
    return [];
  }

  if (!typeDefinition.metadata.relations) {
    return [];
  }

  for (const relation of Object.values(typeDefinition.metadata.relations)) {
    if (
      relation.directly_related_user_types &&
      relation.directly_related_user_types.length > 0
    ) {
      return relation.directly_related_user_types;
    }
  }

  return [];
}

/**
 * Check if the type definition has an `and` operator
 */
function hasAndOperator(typeDefinition: TypeDefinition): boolean {
  if (!hasRelations(typeDefinition)) {
    return false;
  }

  for (const relation of Object.values(typeDefinition.relations)) {
    if (relation.intersection) {
      return true;
    }
  }

  return false;
}

/**
 * Check if the type definition has a `but not` operator
 */
function hasButNotOperator(typeDefinition: TypeDefinition): boolean {
  if (!hasRelations(typeDefinition)) {
    return false;
  }

  for (const relation of Object.values(typeDefinition.relations)) {
    if (relation.difference) return true;
  }

  return false;
}

/**
 * Check if the type definition has relations
 */
function hasRelations(
  typeDefinition: TypeDefinition,
): typeDefinition is TypeDefinition & {
  relations: { [key: string]: Userset };
} {
  return typeDefinition.relations !== undefined;
}

/**
 * Check if the type definition has a type restriction relation
 */
function hasTypeRestrictionRelation(typeDefinition: TypeDefinition): boolean {
  if (!hasRelations(typeDefinition)) {
    return false;
  }

  const directlyRelatedUserTypes = getDirectlyRelatedUserTypes(typeDefinition);
  if (directlyRelatedUserTypes.length === 0) {
    return false;
  }

  return directlyRelatedUserTypes.some(
    (relation) => relation.relation !== undefined,
  );
}

/**
 * Check if the type definition has a type restriction wildcard
 */
function hasTypeRestrictionWildcard(typeDefinition: TypeDefinition): boolean {
  if (!hasRelations(typeDefinition)) {
    return false;
  }

  const directlyRelatedUserTypes = getDirectlyRelatedUserTypes(typeDefinition);
  if (directlyRelatedUserTypes.length === 0) {
    return false;
  }

  return directlyRelatedUserTypes.some(
    (relation) => relation.wildcard !== undefined,
  );
}
