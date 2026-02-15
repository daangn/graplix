type ResolverValue<T> = T | ReadonlyArray<T> | null;

/**
 * Data access contract for a single Graplix entity type.
 */
export interface Resolver<TEntity, TRootContext = object> {
  /**
   * Returns the stable entity identifier for a loaded value.
   */
  id(entity: TEntity): string;

  /**
   * Loads an entity by identifier.
   */
  load(id: string, context: TRootContext): Promise<TEntity | null>;

  /**
   * Relation resolvers keyed by relation name in the Graplix schema.
   */
  relations?: {
    [relation: string]: (
      entity: TEntity,
      context: TRootContext,
    ) => ResolverValue<unknown> | Promise<ResolverValue<unknown>>;
  };
}
