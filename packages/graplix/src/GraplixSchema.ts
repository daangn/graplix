import type { BaseEntityTypeMap } from "./BaseEntityTypeMap";
import type { Arrayable } from "./utils";

export type GraplixDirectlyRelatedUserTypes<
  EntityTypeMap extends BaseEntityTypeMap,
> = {
  type: Extract<keyof EntityTypeMap, string>;
};

export type GraplixComputedSetRelationDefinition = {
  when: string;
  from?: never;
};

export type GraplixTupleToUsersetRelationDefinition = {
  when: string;
  from: string;
};

export type GraplixUnionRelationDefinition =
  | GraplixComputedSetRelationDefinition
  | GraplixTupleToUsersetRelationDefinition;

export type GraplixSchemaRelationDefinition<
  EntityTypeMap extends BaseEntityTypeMap,
> = Arrayable<
  | GraplixDirectlyRelatedUserTypes<EntityTypeMap>
  | GraplixUnionRelationDefinition
>;

export type GraplixSchema<EntityTypeMap extends BaseEntityTypeMap> = {
  [SelectedNodeTypeName in Extract<keyof EntityTypeMap, string>]: {
    [relationName: string]: GraplixSchemaRelationDefinition<EntityTypeMap>;
  };
};
