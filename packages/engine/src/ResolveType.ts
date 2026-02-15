/**
 * Resolves the Graplix type name for an arbitrary runtime value.
 *
 * Return `null` to fall back to resolver scanning.
 */
export type ResolveType<TContext = object> = (
  value: unknown,
  context: TContext,
) => string | null | Promise<string | null>;
