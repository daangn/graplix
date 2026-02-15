import type { TypeResolver } from "./TypeResolver";

export type Resolvers<TRootContext = object> = {
  [typeName: string]: TypeResolver<unknown, TRootContext>;
};
