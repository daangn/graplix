import type { CheckQuery } from "./CheckQuery";
import type { GraplixEngine } from "./GraplixEngine";
import type { GraplixOptions } from "./GraplixOptions";
import type { EntityRef } from "./private/EntityRef";
import { evaluateRelation } from "./private/evaluateRelation";
import type { InternalState } from "./private/InternalState";
import { requireEntityRefKey } from "./private/requireEntityRefKey";
import { resolveSchema } from "./private/resolveSchema";

export function createEngine<TContext = object>(
  options: GraplixOptions<TContext>,
): GraplixEngine<TContext> {
  const resolvedSchema = resolveSchema(options.schema);

  const check = async (query: CheckQuery<TContext>): Promise<boolean> => {
    const schema = await resolvedSchema;
    const context = query.context ?? ({} as TContext);
    const state: InternalState<TContext> = {
      context,
      schema,
      resolvers: options.resolvers,
      resolveType: options.resolveType,
      relationValuesCache: new Map<string, readonly EntityRef[]>(),
      entityCache: new Map<string, unknown | null>(),
      visited: new Set<string>(),
    };

    const user = requireEntityRefKey(query.user, "user");
    const object = requireEntityRefKey(query.object, "object");

    return evaluateRelation(state, object, query.relation, user);
  };

  return { check };
}
