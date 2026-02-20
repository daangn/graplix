import type { LRUCache } from "lru-cache";
import type { Resolvers } from "../Resolvers";
import type { ResolveType } from "../ResolveType";
import type { EntityRef } from "./EntityRef";
import type { ResolvedSchema } from "./ResolvedSchema";
import type { TraceState } from "./TraceState";

/**
 * Boxed entity value stored in the entity cache.
 * Wraps `unknown | null` so that a cached null (entity not found)
 * is distinguishable from a cache miss (`undefined` returned by LRUCache).
 */
export interface CachedEntity {
  readonly value: unknown | null;
}

export interface InternalState<TContext> {
  readonly context: TContext;
  readonly schema: ResolvedSchema;
  readonly resolvers: Resolvers<TContext>;
  readonly resolveType: ResolveType<TContext>;
  readonly resolverTimeoutMs: number | undefined;
  readonly relationValuesCache: LRUCache<string, readonly EntityRef[]>;
  readonly entityCache: LRUCache<string, CachedEntity>;
  readonly visited: Set<string>;
  readonly trace?: TraceState;
}
