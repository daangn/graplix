import { EntityRef } from "./EntityRef";
import type { InternalState } from "./InternalState";
import { isEntityRef } from "./isEntityRef";
import { withTimeout } from "./withTimeout";

function describeValue(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    return json.length > 120 ? `${json.slice(0, 120)}…` : json;
  } catch {
    return String(value);
  }
}

export async function toEntityRef<TContext>(
  value: unknown,
  state: InternalState<TContext>,
): Promise<EntityRef> {
  // Fast path: already an EntityRef instance.
  if (isEntityRef(value)) {
    return value;
  }

  let lastError: Error | undefined;

  try {
    let resolveTypePromise = Promise.resolve(
      state.resolveType(value, state.context),
    );
    if (state.resolverTimeoutMs !== undefined) {
      resolveTypePromise = withTimeout(
        resolveTypePromise,
        state.resolverTimeoutMs,
        "resolveType",
      );
    }

    const resolvedType = await resolveTypePromise;
    if (resolvedType !== null) {
      const resolver = state.resolvers[resolvedType];
      if (resolver === undefined) {
        throw new Error(
          `resolveType returned "${resolvedType}" but no resolver is registered for that type.`,
        );
      }

      const id = resolver.id(value);
      return new EntityRef(resolvedType, id);
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
        return new EntityRef(typeName, id);
      }

      if (resolver.id(loaded) === id) {
        return new EntityRef(typeName, id);
      }
    } catch (error) {
      if (error instanceof Error) {
        lastError = error;
      }
    }
  }

  const valueDesc = describeValue(value);
  const contextMessage =
    lastError === undefined ? "" : ` Last error: ${lastError.message}`;

  throw new Error(
    `Cannot resolve entity type for value: ${valueDesc}. Add { type, id } fields, provide resolveType, or provide a matching resolver id/load pair.${contextMessage}`,
  );
}
