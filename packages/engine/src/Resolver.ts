type ResolverValue<T> = T | ReadonlyArray<T> | null;

export interface Resolver<TEntity, TRootContext = object> {
  id(entity: TEntity): string;

  load(id: string, context: TRootContext): Promise<TEntity | null>;

  relations?: {
    [relation: string]: (
      entity: TEntity,
      context: TRootContext,
    ) => ResolverValue<unknown> | Promise<ResolverValue<unknown>>;
  };
}
