import type { CheckExplainResult } from "./CheckExplainResult";
import type { GraplixEngine } from "./GraplixEngine";
import type { GraplixOptions } from "./GraplixOptions";
import type { EntityRef } from "./private/EntityRef";
import { evaluateRelation } from "./private/evaluateRelation";
import type { InternalState } from "./private/InternalState";
import { resolveSchema } from "./private/resolveSchema";
import { toEntityRef } from "./private/toEntityRef";
import type { TraceState } from "./private/TraceState";
import type { Query } from "./Query";

/**
 * Creates a Graplix evaluation engine for a schema and resolver set.
 */
export function createEngine<TContext = object, TEntityInput = never>(
  options: GraplixOptions<TContext>,
): GraplixEngine<TContext, TEntityInput> {
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

  const check = async (query: Query<TContext, TEntityInput>): Promise<boolean> => {
    const schema = await resolvedSchema;
    const context = query.context ?? ({} as TContext);
    const state = createState(context, schema);

    const user = await toEntityRef(query.user, state);
    const object = await toEntityRef(query.object, state);

    return evaluateRelation(state, object, query.relation, user);
  };

  const explain = async (
    query: Query<TContext, TEntityInput>,
  ): Promise<CheckExplainResult> => {
    const schema = await resolvedSchema;
    const context = query.context ?? ({} as TContext);
    const trace: TraceState = {
      exploredEdges: [],
      currentPath: [],
      matchedPath: null,
    };
    const state = createState(context, schema, trace);

    const user = await toEntityRef(query.user, state);
    const object = await toEntityRef(query.object, state);

    const allowed = await evaluateRelation(state, object, query.relation, user);

    return {
      allowed,
      matchedPath: trace.matchedPath,
      exploredEdges: trace.exploredEdges,
    };
  };

  return { check, explain };
}
