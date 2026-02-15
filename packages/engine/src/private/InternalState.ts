import type { Resolvers } from "../Resolvers";
import type { ResolveType } from "../ResolveType";
import type { EntityRef } from "./EntityRef";
import type { ResolvedSchema } from "./ResolvedSchema";

export interface InternalState<TContext> {
  readonly context: TContext;
  readonly schema: ResolvedSchema;
  readonly resolvers: Resolvers<TContext>;
  readonly resolveType: ResolveType<TContext>;
  readonly relationValuesCache: Map<string, readonly EntityRef[]>;
  readonly entityCache: Map<string, unknown | null>;
  readonly visited: Set<string>;
}
