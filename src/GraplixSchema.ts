import type { BaseNodeTypeMap } from "./BaseNodeTypeMap";
import type { Arrayable } from "./utils";

type GraplixSchemaRelationDefinition<NodeTypeMap extends BaseNodeTypeMap> =
  Arrayable<
    | {
        type: Extract<keyof NodeTypeMap, string>;
      }
    | {
        when: string;
        from?: string;
      }
  >;

export type GraplixSchema<NodeTypeMap extends BaseNodeTypeMap> = {
  [SelectedNodeTypeName in Extract<keyof NodeTypeMap, string>]: {
    [relationName: string]: GraplixSchemaRelationDefinition<NodeTypeMap>;
  };
};
