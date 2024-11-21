import type { BaseNodeTypeMap } from "./BaseNodeTypeMap";
import type { GraplixResolvers } from "./GraplixResolvers";
import type { GraplixSchema } from "./GraplixSchema";
import type { ValueOf } from "./utils";

export type GraplixInput<
  Context extends {},
  NodeTypeMap extends BaseNodeTypeMap,
> = {
  schema: GraplixSchema<NodeTypeMap>;
  resolvers: GraplixResolvers<Context, NodeTypeMap>;
  identifyNode: (node: ValueOf<NodeTypeMap>) => {
    type: Extract<keyof NodeTypeMap, string>;
    id: string;
  };
};
