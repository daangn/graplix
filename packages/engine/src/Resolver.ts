import type { ResolverInfo } from "./ResolverInfo";

type ResolverValue<T> = T | ReadonlyArray<T> | null;

type RelationResolver<TEntity, TContext> = {
  __relation(
    entity: TEntity,
    context: TContext,
    info: ResolverInfo,
  ): ResolverValue<unknown> | Promise<ResolverValue<unknown>>;
}["__relation"];

/**
 * Data access contract for a single Graplix entity type.
 */
export interface Resolver<TEntity, TContext = object> {
  /**
   * Returns the stable entity identifier for a loaded value.
   */
  id(entity: TEntity): string;

  /**
   * Loads an entity by identifier.
   */
  load(
    id: string,
    context: TContext,
    info: ResolverInfo,
  ): Promise<TEntity | null>;

  /**
   * Relation resolvers keyed by relation name in the Graplix schema.
   */
  relations?: {
    [relation: string]: RelationResolver<TEntity, TContext>;
  };
}
