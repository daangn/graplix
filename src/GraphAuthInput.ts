import type { BaseNodeTypeMap } from "./BaseNodeTypeMap";
import type { GraphAuthResolvers } from "./GraphAuthResolvers";
import type { GraphAuthSchema } from "./GraphAuthSchema";
import type { ValueOf } from "./utils";

export type GraphAuthInput<
  Context extends {},
  NodeTypeMap extends BaseNodeTypeMap,
> = {
  schema: GraphAuthSchema<NodeTypeMap>;
  resolvers: GraphAuthResolvers<Context, NodeTypeMap>;
  identifyNode: (node: ValueOf<NodeTypeMap>) => {
    type: Extract<keyof NodeTypeMap, string>;
    id: string;
  };
};
