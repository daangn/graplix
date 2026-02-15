import type { Resolver } from "./Resolver";

export type Resolvers<TRootContext = object> = {
  [typeName: string]: Resolver<unknown, TRootContext>;
};
