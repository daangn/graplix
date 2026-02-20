import { LRUCache } from "lru-cache";
import type { CheckExplainResult } from "./CheckExplainResult";
import type { GraplixEngine } from "./GraplixEngine";
import type { GraplixOptions } from "./GraplixOptions";
import type { EntityRef } from "./private/EntityRef";
import { evaluateRelation } from "./private/evaluateRelation";
import type { CachedEntity, InternalState } from "./private/InternalState";
import { resolveSchema } from "./private/resolveSchema";
import type { TraceState } from "./private/TraceState";
import { toEntityRef } from "./private/toEntityRef";
import type { Query } from "./Query";

const DEFAULT_MAX_CACHE_SIZE = 500;

/**
 * Creates a Graplix evaluation engine for a schema and resolver set.
 */
export function createEngine<TContext = object, TEntityInput = never>(
  options: GraplixOptions<TContext>,
): GraplixEngine<TContext, TEntityInput> {
  const resolvedSchema = resolveSchema(options.schema);
  const maxCacheSize = options.maxCacheSize ?? DEFAULT_MAX_CACHE_SIZE;

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
      resolverTimeoutMs: options.resolverTimeoutMs,
      relationValuesCache: new LRUCache<string, readonly EntityRef[]>({
        max: maxCacheSize,
      }),
      entityCache: new LRUCache<string, CachedEntity>({ max: maxCacheSize }),
      visited: new Set<string>(),
      trace,
    };
  };

  const check = async (
    query: Query<TContext, TEntityInput>,
  ): Promise<boolean> => {
    const schema = await resolvedSchema;
    const context = query.context;
    const state = createState(context, schema);

    const user = await toEntityRef(query.user, state);
    const object = await toEntityRef(query.object, state);

    return evaluateRelation(state, object, query.relation, user);
  };

  const explain = async (
    query: Query<TContext, TEntityInput>,
  ): Promise<CheckExplainResult> => {
    const schema = await resolvedSchema;
    const context = query.context;
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
