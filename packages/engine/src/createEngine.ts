import type { CheckExplainResult } from "./CheckExplainResult";
import type { GraplixEngine } from "./GraplixEngine";
import type { GraplixOptions } from "./GraplixOptions";
import type { EntityRef } from "./private/EntityRef";
import { evaluateRelation } from "./private/evaluateRelation";
import type { InternalState } from "./private/InternalState";
import { requireEntityRefKey } from "./private/requireEntityRefKey";
import { resolveSchema } from "./private/resolveSchema";
import type { TraceState } from "./private/TraceState";
import type { Query } from "./Query";

export function createEngine<TContext = object>(
  options: GraplixOptions<TContext>,
): GraplixEngine<TContext> {
  const resolvedSchema = resolveSchema(options.schema);

  const createState = (
    context: TContext,
    schema: Awaited<ReturnType<typeof resolveSchema>>,
    trace?: TraceState,
  ): InternalState<TContext> => {
    return {
      context,
      schema,
      resolvers: options.resolvers,
      resolveType: options.resolveType,
      relationValuesCache: new Map<string, readonly EntityRef[]>(),
      entityCache: new Map<string, unknown | null>(),
      visited: new Set<string>(),
      trace,
    };
  };

  const check = async (query: Query<TContext>): Promise<boolean> => {
    const schema = await resolvedSchema;
    const context = query.context ?? ({} as TContext);
    const state = createState(context, schema);

    const user = requireEntityRefKey(query.user, "user");
    const object = requireEntityRefKey(query.object, "object");

    return evaluateRelation(state, object, query.relation, user);
  };

  const explain = async (
    query: Query<TContext>,
  ): Promise<CheckExplainResult> => {
    const schema = await resolvedSchema;
    const context = query.context ?? ({} as TContext);
    const trace: TraceState = {
      exploredEdges: [],
      currentPath: [],
      matchedPath: null,
    };
    const state = createState(context, schema, trace);

    const user = requireEntityRefKey(query.user, "user");
    const object = requireEntityRefKey(query.object, "object");

    const allowed = await evaluateRelation(state, object, query.relation, user);

    return {
      allowed,
      matchedPath: trace.matchedPath,
      exploredEdges: trace.exploredEdges,
    };
  };

  return { check, explain };
}
