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

    for (const typeDeclaration of document.types) {
      const declaredRelations = new Set(
        typeDeclaration.relations?.relations.map((relation) => relation.name) ??
          [],
      );

      for (const relation of typeDeclaration.relations?.relations ?? []) {
        this.validateRelation(
          relation,
          typeDeclaration,
          declaredTypeNames,
          declaredRelations,
          accept,
        );
      }
    }
  }

  private validateRelation(
    relation: GraplixRelationDefinition,
    typeDeclaration: GraplixTypeDeclaration,
    declaredTypeNames: Set<TypeName>,
    declaredRelations: Set<RelationName>,
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
          declaredRelations,
          accept,
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
    declaredRelations: Set<RelationName>,
    accept: ValidationAcceptor,
  ): void {
    if (!declaredRelations.has(term.relation)) {
      accept(
        "error",
        `Relation "${term.relation}" is not declared in type "${typeDeclaration.name}".`,
        { node: term, property: RELATION_PROPERTY },
      );
    }

    if (term.source !== undefined && !declaredRelations.has(term.source)) {
      accept(
        "error",
        `Relation source "${term.source}" is not declared in type "${typeDeclaration.name}".`,
        { node: term, property: "source" },
      );
    }
  }
}
