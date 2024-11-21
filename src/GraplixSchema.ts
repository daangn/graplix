import type { BaseEntityTypeMap } from "./BaseEntityTypeMap";
import type { Arrayable } from "./utils";

type GraplixSchemaRelationDefinition<EntityTypeMap extends BaseEntityTypeMap> =
  Arrayable<
    | {
        type: Extract<keyof EntityTypeMap, string>;
      }
    | {
        when: string;
        from?: string;
      }
  >;

export type GraplixSchema<EntityTypeMap extends BaseEntityTypeMap> = {
  [SelectedNodeTypeName in Extract<keyof EntityTypeMap, string>]: {
    [relationName: string]: GraplixSchemaRelationDefinition<EntityTypeMap>;
  };
};
