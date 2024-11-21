import type { BaseNodeTypeMap } from "./BaseNodeTypeMap";
import type { GraplixInput } from "./GraplixInput";
import { query } from "./query";
import type { ValueOf } from "./utils";

export type Graplix<Context extends {}, NodeTypeMap extends BaseNodeTypeMap> = {
  check: (args: {
    user: ValueOf<NodeTypeMap>;
    object: ValueOf<NodeTypeMap>;
    relation: string;
    context: Context;
  }) => Promise<boolean>;
};

export function graplix<
  Context extends {},
  NodeTypeMap extends BaseNodeTypeMap,
>(input: GraplixInput<Context, NodeTypeMap>): Graplix<Context, NodeTypeMap> {
  return {
    async check({ context, object, relation, user }) {
      const graph = await query(input, {
        object,
        relation,
        user,
        context,
      });

      const nodes = Array.from(graph.nodeEntries());
      return nodes.some((node) => node.attributes.matched);
    },
  };
}
