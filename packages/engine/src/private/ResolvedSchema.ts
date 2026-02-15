import type { GraplixRelationTerm } from "@graplix/language";

export interface ResolvedSchema {
  readonly types: ReadonlyMap<string, ResolvedTypeDefinition>;
}

export interface ResolvedTypeDefinition {
  readonly relations: ReadonlyMap<string, ResolvedRelationDefinition>;
}

export interface ResolvedRelationDefinition {
  readonly terms: readonly GraplixRelationTerm[];
  readonly directTargetTypes: ReadonlySet<string>;
}
