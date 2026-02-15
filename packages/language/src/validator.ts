import type { ValidationAcceptor, ValidationChecks } from "langium";
import type {
  GraplixAstType,
  GraplixDirectTypes,
  GraplixDocument,
  GraplixRelationDefinition,
  GraplixRelationFrom,
  GraplixTypeDeclaration,
} from "./__generated__/ast";
import {
  isGraplixDirectTypes,
  isGraplixRelationFrom,
} from "./__generated__/ast";
import type { GraplixServices } from "./services";

const RELATION_PROPERTY = "relation";
const SOURCE_PROPERTY = "source";

type RelationName = string;
type TypeName = string;

export function registerValidationChecks(services: GraplixServices): void {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.GraplixValidator;
  const checks: ValidationChecks<GraplixAstType> = {
    GraplixDocument: validator.checkTypeAndRelationReferences,
  };

  registry.register(checks, validator);
}

export class GraplixValidator {
  checkTypeAndRelationReferences(
    document: GraplixDocument,
    accept: ValidationAcceptor,
  ): void {
    const declaredTypeNames = new Set(document.types.map((type) => type.name));
    const typeByName = new Map<TypeName, GraplixTypeDeclaration>(
      document.types.map((type) => [type.name, type]),
    );

    for (const typeDeclaration of document.types) {
      const declaredRelations = new Set(
        typeDeclaration.relations?.relations.map((relation) => relation.name) ??
          [],
      );
      const relationByName = new Map<RelationName, GraplixRelationDefinition>(
        typeDeclaration.relations?.relations.map((relation) => [
          relation.name,
          relation,
        ]) ?? [],
      );

      for (const relation of typeDeclaration.relations?.relations ?? []) {
        this.validateRelation(
          relation,
          typeDeclaration,
          typeByName,
          declaredTypeNames,
          declaredRelations,
          relationByName,
          accept,
        );
      }
    }
  }

  private validateRelation(
    relation: GraplixRelationDefinition,
    typeDeclaration: GraplixTypeDeclaration,
    typeByName: Map<TypeName, GraplixTypeDeclaration>,
    declaredTypeNames: Set<TypeName>,
    declaredRelations: Set<RelationName>,
    relationByName: Map<RelationName, GraplixRelationDefinition>,
    accept: ValidationAcceptor,
  ): void {
    for (const term of relation.expression.terms) {
      if (isGraplixDirectTypes(term)) {
        this.validateDirectTypes(term, declaredTypeNames, accept);
      }

      if (isGraplixRelationFrom(term)) {
        this.validateComputedRelation(
          term,
          typeDeclaration,
          typeByName,
          relationByName,
          accept,
          declaredRelations,
        );
      }
    }
  }

  private validateDirectTypes(
    term: GraplixDirectTypes,
    declaredTypeNames: Set<TypeName>,
    accept: ValidationAcceptor,
  ): void {
    for (const targetType of term.targets) {
      if (!declaredTypeNames.has(targetType)) {
        accept(
          "error",
          `Type "${targetType}" is not declared in this schema.`,
          {
            node: term,
            property: "targets",
            index: term.targets.indexOf(targetType),
          },
        );
      }
    }
  }

  private validateComputedRelation(
    term: GraplixRelationFrom,
    typeDeclaration: GraplixTypeDeclaration,
    typeByName: Map<TypeName, GraplixTypeDeclaration>,
    relationByName: Map<RelationName, GraplixRelationDefinition>,
    accept: ValidationAcceptor,
    declaredRelations: Set<RelationName>,
  ): void {
    if (term.source === undefined) {
      if (!declaredRelations.has(term.relation)) {
        accept(
          "error",
          `Relation "${term.relation}" is not declared in type "${typeDeclaration.name}".`,
          { node: term, property: RELATION_PROPERTY },
        );
      }
      return;
    }

    if (!declaredRelations.has(term.source)) {
      accept(
        "error",
        `Relation source "${term.source}" is not declared in type "${typeDeclaration.name}".`,
        { node: term, property: SOURCE_PROPERTY },
      );
      return;
    }

    const sourceRelation = relationByName.get(term.source);
    if (sourceRelation === undefined) {
      return;
    }

    const targetTypeNames = new Set<TypeName>(
      sourceRelation.expression.terms
        .filter(isGraplixDirectTypes)
        .flatMap((sourceTerm) => sourceTerm.targets),
    );
    const relationExistsInSourceType = this.isRelationDeclaredInTargetTypes(
      term.relation,
      targetTypeNames,
      typeByName,
    );

    if (!relationExistsInSourceType) {
      const targetTypeList = [...targetTypeNames].join(", ");
      accept(
        "error",
        `Relation "${term.relation}" is not declared in relation source type(s) ${targetTypeList}.`,
        { node: term, property: RELATION_PROPERTY },
      );
    }
  }

  private isRelationDeclaredInTargetTypes(
    relationName: RelationName,
    targetTypeNames: Set<TypeName>,
    typeByName: Map<TypeName, GraplixTypeDeclaration>,
  ): boolean {
    if (targetTypeNames.size === 0) {
      return false;
    }

    return [...targetTypeNames].some((targetTypeName) => {
      return (
        typeByName
          .get(targetTypeName)
          ?.relations?.relations.some(
            (relation) => relation.name === relationName,
          ) ?? false
      );
    });
  }
}
