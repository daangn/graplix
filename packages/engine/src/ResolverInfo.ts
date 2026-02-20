/**
 * Metadata passed to every resolver call.
 * Additional fields may be added here in the future without breaking signatures.
 */
export interface ResolverInfo {
  /**
   * Aborted when the resolver's configured timeout fires.
   * Resolvers can use this to cancel in-flight work (e.g. database queries).
   */
  readonly signal: AbortSignal;
}
