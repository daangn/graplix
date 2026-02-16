import type { Resolver } from "./Resolver";

/**
 * Resolver map keyed by Graplix type name.
 */
export type Resolvers<TContext = object> = {
  [typeName: string]: Resolver<unknown, TContext>;
};
