/**
 * Resolves the Graplix type name for an arbitrary runtime value.
 *
 * Must return the correct Graplix type name for every entity value the engine
 * may encounter — including values returned by relation resolvers.
 */
export type ResolveType<TContext = object> = (
  value: unknown,
  context: TContext,
) => string;
