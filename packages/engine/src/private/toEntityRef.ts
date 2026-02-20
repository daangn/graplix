import { EntityRef } from "../EntityRef";
import type { InternalState } from "./InternalState";

export function toEntityRef<TContext>(
  value: unknown,
  state: InternalState<TContext>,
): EntityRef {
  const resolvedType = state.resolveType(value, state.context);
  const resolver = state.resolvers[resolvedType];
  if (resolver === undefined) {
    throw new Error(
      `resolveType returned "${resolvedType}" but no resolver is registered for that type.`,
    );
  }
  return new EntityRef(resolvedType, resolver.id(value));
}
