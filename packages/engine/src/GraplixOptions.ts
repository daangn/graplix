import type { Resolvers } from "./Resolvers";
import type { ResolveType } from "./ResolveType";

export interface GraplixOptions<TContext = object> {
  readonly schema: string;
  readonly resolvers: Resolvers<TContext>;
  readonly resolveType: ResolveType<TContext>;
}
