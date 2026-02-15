export type ResolveType<TContext = object> = (
  value: unknown,
  context: TContext,
) => string | null | Promise<string | null>;
