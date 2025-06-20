import type { BaseEntityTypeMap } from "./BaseEntityTypeMap";
import type { GraplixInput } from "./GraplixInput";
import { query } from "./query";
import type { ValueOf } from "./utils";

export type Graplix<
  Context extends {},
  EntityTypeMap extends BaseEntityTypeMap,
> = {
  check: (args: {
    user: ValueOf<EntityTypeMap>;
    object: ValueOf<EntityTypeMap>;
    relation: string;
    context: Context;
  }) => Promise<boolean>;
};

export function graplix<
  Context extends {},
  EntityTypeMap extends BaseEntityTypeMap,
>(
  input: GraplixInput<Context, EntityTypeMap>,
): Graplix<Context, EntityTypeMap> {
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
