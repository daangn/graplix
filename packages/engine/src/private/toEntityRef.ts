import type { EntityRef } from "./EntityRef";
import type { InternalState } from "./InternalState";
import { isEntityRef } from "./isEntityRef";
import { parseEntityRefKey } from "./parseEntityRefKey";

export async function toEntityRef<TContext>(
  value: unknown,
  state: InternalState<TContext>,
): Promise<EntityRef> {
  const parsed = parseEntityRefKey(value);
  if (parsed !== undefined) {
    return parsed;
  }

  if (isEntityRef(value)) {
    return value;
  }

  let lastError: Error | undefined;

  try {
    const resolvedType = await state.resolveType(value, state.context);
    if (resolvedType !== null) {
      const resolver = state.resolvers[resolvedType];
      if (resolver === undefined) {
        throw new Error(
          `resolveType returned "${resolvedType}" but no resolver is registered for that type.`,
        );
      }

      const id = resolver.id(value);
      return { type: resolvedType, id };
    }
  } catch (error) {
    if (error instanceof Error) {
      lastError = error;
    }
  }

  for (const [typeName, resolver] of Object.entries(state.resolvers)) {
    try {
      const id = resolver.id(value);
      const loaded = await resolver.load(id, state.context);

      if (loaded === null) {
        continue;
      }

      if (loaded === value) {
        return { type: typeName, id };
      }

      if (resolver.id(loaded) === id) {
        return { type: typeName, id };
      }
    } catch (error) {
      if (error instanceof Error) {
        lastError = error;
      }
    }
  }

  const contextMessage =
    lastError === undefined ? "" : ` Last resolver error: ${lastError.message}`;

  throw new Error(
    `Cannot infer entity type from value. Use "type:id", add { type, id } fields, provide resolveType, or provide a matching resolver id/load pair.${contextMessage}`,
  );
}
