import type { Resolver } from "./Resolver";

/**
 * Resolver map keyed by Graplix type name.
 */
export type Resolvers<TRootContext = object> = {
  [typeName: string]: Resolver<unknown, TRootContext>;
};
