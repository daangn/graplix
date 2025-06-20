import { DirectedGraph } from "graphology";
import * as R from "remeda";
import type { BaseEntityTypeMap } from "./BaseEntityTypeMap";
import type { GraplixInput } from "./GraplixInput";
import type { ValueOf } from "./utils";
import {
  assignGraph,
  compileNodeId,
  isEqual,
  normalizeArrayable,
} from "./utils";

export type QueryParameters<
  Context extends {},
  EntityTypeMap extends BaseEntityTypeMap,
> = {
  user: ValueOf<EntityTypeMap>;
  object: ValueOf<EntityTypeMap>;
  relation: string;
  context: Context;
};

export type QueryOptions<
  Context extends {},
  EntityTypeMap extends BaseEntityTypeMap,
> = {
  initialParams?: QueryParameters<Context, EntityTypeMap>;
  implicit?: boolean;
};

export async function query<
  Context extends {},
  EntityTypeMap extends BaseEntityTypeMap,
>(
  input: GraplixInput<Context, EntityTypeMap>,
  params: QueryParameters<Context, EntityTypeMap>,
  options?: QueryOptions<Context, EntityTypeMap>,
): Promise<
  DirectedGraph<{ node: any; matched: boolean }, { relation: string }>
> {
  const object = params.object;
  const { type: objectType } = input.identify(object);
  const objectNodeId = compileNodeId(input.identify(object));

  const user = params.user;
  const userNodeId = compileNodeId(input.identify(user));

  const graph = new DirectedGraph<
    { node: any; matched: boolean },
    { relation: string }
  >();

  graph.addNode(objectNodeId, {
    node: object,
    matched: !options?.implicit && objectNodeId === userNodeId,
  });

  const isCircularDependency =
    options?.initialParams &&
    isEqual(
      (t) => compileNodeId(input.identify(t)),
      params.object,
      options.initialParams.object,
    ) &&
    params.relation === options.initialParams.relation;

  if (isCircularDependency) {
    return graph;
  }

  const initialParams = options?.initialParams ?? params;

  const relationDefinitions = normalizeArrayable(
    input.schema[objectType][params.relation],
  );
  const resolverDefinitions = normalizeArrayable(
    input.resolvers[objectType][params.relation],
  );

  /**
   * { type: "..." }
   */
  await R.pipe(
    relationDefinitions,
    R.filter(
      (def): def is Extract<typeof def, { type: string }> => "type" in def,
    ),
    R.map(async (relationDefinition) => {
      const resolverDefinition = resolverDefinitions.find(
        (d) => d.type === relationDefinition.type,
      );

      if (!resolverDefinition?.resolve) {
        return;
      }

      const nextNodes = await resolverDefinition
        .resolve(params.object, params.context)
        .then((o) => normalizeArrayable(o));

      for (const nextNode of nextNodes) {
        const nextNodeId = compileNodeId(input.identify(nextNode));

        /**
         * - if implicit relation, return false
         * - if not implicit relation and nextNodeId is equal to userNodeId, return true
         */
        const matched = !options?.implicit && nextNodeId === userNodeId;

        try {
          graph.dropNode(nextNodeId);
        } catch (e) {}

        graph.addNode(nextNodeId, {
          node: nextNode,
          matched,
        });

        graph.addDirectedEdge(objectNodeId, nextNodeId, {
          relation: params.relation,
        });
      }
    }),
    (promises) => Promise.all(promises),
  );

  /**
   * { when: "...", ?? }
   */
  await R.pipe(
    relationDefinitions,
    R.filter(
      (def): def is Extract<typeof def, { when: string }> => "when" in def,
    ),
    R.map(async (relationDefinition) => {
      /**
       * { when: "..." }
       */
      if (!relationDefinition.from) {
        const g1 = await query(
          input,
          {
            ...params,
            relation: relationDefinition.when,
          },
          {
            initialParams,
          },
        );

        assignGraph(graph, g1);
      }

      /**
       * { when: "...", from: "..." }
       */
      if (relationDefinition.from) {
        const g2 = await query(
          input,
          {
            ...params,
            relation: relationDefinition.from,
          },
          {
            initialParams,
            implicit: true,
          },
        );

        assignGraph(graph, g2);

        await R.pipe(
          Array.from(g2.nodeEntries()),
          R.map(async ({ node: nodeId, attributes: { node } }) => {
            if (nodeId === objectNodeId) {
              return;
            }

            const g3 = await query(
              input,
              {
                ...params,
                object: node,
                relation: relationDefinition.when,
              },
              {
                initialParams,
              },
            );

            assignGraph(graph, g3);
          }),
          (promises) => Promise.all(promises),
        );
      }
    }),
    (promises) => Promise.all(promises),
  );

  return graph;
}
