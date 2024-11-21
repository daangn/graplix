import { DirectedGraph } from "graphology";
import * as R from "remeda";

import type { BaseNodeTypeMap } from "./BaseNodeTypeMap";
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
  NodeTypeMap extends BaseNodeTypeMap,
> = {
  /**
   * @description 인가을 요청한 사용자 Node
   */
  user: ValueOf<NodeTypeMap>;

  /**
   * @description 인가 대상 Node
   */
  object: ValueOf<NodeTypeMap>;

  /**
   * @description 사용자와 인가 대상 사이를 연결하는 관계
   */
  relation: string;

  /**
   * @description Resolver 실행에 전달되는 `context` 값
   */
  context: Context;
};

export type QueryOptions<
  Context extends {},
  NodeTypeMap extends BaseNodeTypeMap,
> = {
  /**
   * @description (private) 재귀 함수의 순환 참조 문제를 알아내기 위한 초기 파라미터
   */
  initialParams?: QueryParameters<Context, NodeTypeMap>;

  /**
   * @description (private) 암묵적 관계 추론을 위한 flag
   */
  implicit?: boolean;
};

export async function query<
  Context extends {},
  NodeTypeMap extends BaseNodeTypeMap,
>(
  input: GraplixInput<Context, NodeTypeMap>,
  params: QueryParameters<Context, NodeTypeMap>,
  options?: QueryOptions<Context, NodeTypeMap>,
): Promise<
  DirectedGraph<{ node: any; matched: boolean }, { relation: string }>
> {
  const object = params.object;
  const { type: objectType } = input.identifyNode(object);
  const objectNodeId = compileNodeId(input.identifyNode(object));

  const user = params.user;
  const userNodeId = compileNodeId(input.identifyNode(user));

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
      (t) => compileNodeId(input.identifyNode(t)),
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
        const nextNodeId = compileNodeId(input.identifyNode(nextNode));

        /**
         * - implicit relation이라면 false
         * - implicit relation이 아니고, nextNodeId와 userNodeId가 같다면 true
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
   * { when: "...", ... }
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
