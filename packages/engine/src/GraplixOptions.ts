import type { Resolvers } from "./Resolvers";
import type { ResolveType } from "./ResolveType";

/**
 * Engine construction options.
 */
export interface GraplixOptions<TContext = object> {
  /** Raw Graplix schema text. */
  readonly schema: string;
  /** Type-specific data resolvers. */
  readonly resolvers: Resolvers<TContext>;
  /** Runtime type resolver for arbitrary relation outputs. */
  readonly resolveType: ResolveType<TContext>;
}
