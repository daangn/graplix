/**
 * @fileoverview
 * @see https://openfga.dev/docs/authorization-and-openfga
 *
 * 세분화된 권한 부여(Fine-grained Authorization)를 위한, Graph 기반 인가 모듈이에요.
 * 정의한 스키마를 기반으로 Node 간의 관계를 Directed Graph로 표현하고, 이를 통해 인가를 수행해요.
 * (만약 Directed Graph라는 개념이 생소하다면 https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture10.pdf 를 참고하시면 돼요.)
 *
 * 이 모듈을 사용하려면 Schema, Resolver, Context가 필요해요.
 * 각각의 역할은 다음과 같아요. 만약, GraphQL에 익숙하다면 세 요소의 관계를 이해하는건 어렵지 않을거에요.
 *
 * 1. Schema: Record로, 각 Node의 형태와 Node 간의 관계를 정의해요.
 * 2. Resolver: 스키마에 정의된 관계를 어떻게 해석할지 실질적으로 정의(resolving)하는 구현체에요.
 * 3. Context: 리졸버에서 사용할 전역 데이터를 로드하는 구현이 포함되어 있어요.
 *
 * 설명만으로 이해가 가지 않는다면 테스트 케이스와 fixtures 내부의 코드를 참고해주세요.
 */

import type { BaseNodeTypeMap } from "./BaseNodeTypeMap";
import type { GraphAuthInput } from "./GraphAuthInput";
import { query } from "./query";
import type { ValueOf } from "./utils";

export type GraphAuth<
  Context extends {},
  NodeTypeMap extends BaseNodeTypeMap,
> = {
  check: (args: {
    user: ValueOf<NodeTypeMap>;
    object: ValueOf<NodeTypeMap>;
    relation: string;
    context: Context;
  }) => Promise<boolean>;
};

/**
 * ## graphauth
 *
 * 정의한 스키마를 기반으로 Node간의 관계를 directed graph로 표현하고, 이를 통해 인가를 수행해요.
 *
 * ### example
 * ```ts
 * const schema: GraphAuthSchema<ObjectTypeMap> = {
    House: {
      own: {
        type: "User",
      },
      can_enter: {
        when: "own",
      },
    },
    User: {},
  };

  const resolvers: GraphAuthResolvers<Context, ObjectTypeMap> = {
    House: {
      own: {
        type: "User",
        async resolve(obj, ctx) {
          const users = ctx.loaders.user
            .loadMany(obj.ownerIds)
            .then(filterNonError);

          return users;
        },
      },
    },
    User: {},
  };

  export const input: GraphAuthInput<Context, ObjectTypeMap> = {
    schema,
    resolvers,
    identifyNode(obj) {
      return {
        type: obj.entityName,
        id: obj.entityId,
      };
    },
  };

  const { check } = graphauth({
    schema,
    resolvers,
    identifyNode(obj) {
      return {
        type: obj.entityName,
        id: obj.entityId,
      };
    },
  });

  const authorized = await check({
    user: {
      id: 1,
    },
    relation: "can_enter",
    object: {
      id: 1,
      ownerIds: ["0", "1"],
    },
    context,
  });

  console.log(authorized); // true
 * ```
 */
export function graphauth<
  Context extends {},
  NodeTypeMap extends BaseNodeTypeMap,
>(
  input: GraphAuthInput<Context, NodeTypeMap>,
): GraphAuth<Context, NodeTypeMap> {
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
