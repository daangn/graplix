import { LRUCache } from "lru-cache";
import type { BuildEngineOptions } from "./BuildEngineOptions";
import type { CheckExplainResult } from "./CheckExplainResult";
import type { EntityRef } from "./EntityRef";
import type { GraplixEngine } from "./GraplixEngine";
import { evaluateRelation } from "./private/evaluateRelation";
import type { CachedEntity, InternalState } from "./private/InternalState";
import { resolveSchema } from "./private/resolveSchema";
import type { TraceState } from "./private/TraceState";
import { toEntityRef } from "./private/toEntityRef";
import type { Query } from "./Query";

const DEFAULT_MAX_CACHE_SIZE = 500;

/**
 * Builds a Graplix evaluation engine for a schema and resolver set.
 * Parses and validates the schema eagerly — throws on invalid schema.
 */
export async function buildEngine<TContext = object, TEntityInput = never>(
  options: BuildEngineOptions<TContext>,
): Promise<GraplixEngine<TContext, TEntityInput>> {
  const schema = await resolveSchema(options.schema);
  const maxCacheSize = options.maxCacheSize ?? DEFAULT_MAX_CACHE_SIZE;

  const createState = (
    context: TContext,
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
      onError: options.onError,
      trace,
    };
  };

  const check = async (
    query: Query<TContext, TEntityInput>,
  ): Promise<boolean> => {
    const state = createState(query.context);

    const user = toEntityRef(query.user, state);
    const object = toEntityRef(query.object, state);

    return evaluateRelation(state, object, query.relation, user);
  };

  const explain = async (
    query: Query<TContext, TEntityInput>,
  ): Promise<CheckExplainResult> => {
    const trace: TraceState = {
      exploredEdges: [],
      currentPath: [],
      matchedPath: null,
    };
    const state = createState(query.context, trace);

    const user = toEntityRef(query.user, state);
    const object = toEntityRef(query.object, state);

    const allowed = await evaluateRelation(state, object, query.relation, user);

    return {
      allowed,
      matchedPath: trace.matchedPath,
      exploredEdges: trace.exploredEdges,
    };
  };

  return { check, explain };
}
