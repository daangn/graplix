import { EntityRef } from "../EntityRef";
import type { InternalState } from "./InternalState";

function describeValue(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    return json.length > 120 ? `${json.slice(0, 120)}…` : json;
  } catch {
    return String(value);
  }
}

export function toEntityRef<TContext>(
  value: unknown,
  state: InternalState<TContext>,
  allowedTypes?: ReadonlySet<string>,
): EntityRef {
  // Path 1: resolveType — always tried first.
  const resolvedType = state.resolveType(value, state.context);
  if (resolvedType !== null) {
    const resolver = state.resolvers[resolvedType];
    if (resolver === undefined) {
      throw new Error(
        `resolveType returned "${resolvedType}" but no resolver is registered for that type.`,
      );
    }
    return new EntityRef(resolvedType, resolver.id(value));
  }

  // Path 2: schema type hint — used for relation resolver outputs where the
  // schema already narrows the possible target types. Tries each allowed
  // resolver's id() without any load() call.
  if (allowedTypes !== undefined) {
    for (const typeName of allowedTypes) {
      const resolver = state.resolvers[typeName];
      if (resolver === undefined) continue;
      try {
        return new EntityRef(typeName, resolver.id(value));
      } catch {}
    }
  }

  const valueDesc = describeValue(value);
  throw new Error(
    `Cannot resolve entity type for value: ${valueDesc}. Implement resolveType to identify entity types.`,
  );
}
