import type { Resolvers } from "./Resolvers";
import type { ResolveType } from "./ResolveType";

/**
 * Engine construction options.
 */
export interface BuildEngineOptions<TContext = object> {
  /** Raw Graplix schema text. */
  readonly schema: string;

  /** Type-specific data resolvers. */
  readonly resolvers: Resolvers<TContext>;

  /** Runtime type resolver for arbitrary relation outputs. */
  readonly resolveType: ResolveType<TContext>;

  /**
   * Timeout in milliseconds applied to each individual resolver call
   * (`load` and relation resolvers).
   * If a call exceeds this limit it rejects with a timeout error.
   * Omit (or set to `undefined`) to disable timeouts.
   */
  readonly resolverTimeoutMs?: number;

  /**
   * Maximum number of entries in each per-request LRU cache
   * (entity cache and relation-values cache are sized independently).
   * Default: 500.
   */
  readonly maxCacheSize?: number;

  /**
   * Called when an error is silently swallowed during evaluation.
   *
   * This happens when a relation resolver returns an entity whose type cannot
   * be determined — the entity is skipped rather than failing the entire check.
   * Use this callback to log, track metrics, or surface unexpected failures.
   *
   * Throwing from this callback will propagate the error and reject the check.
   */
  readonly onError?: (error: unknown) => void;
}
