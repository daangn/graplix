import type { ResolverInfo } from "../ResolverInfo";
import { EntityRef } from "./EntityRef";
import type { InternalState } from "./InternalState";

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
  allowedTypes?: ReadonlySet<string>,
): Promise<EntityRef> {
  let lastError: Error | undefined;

  try {
    const resolvedType = state.resolveType(value, state.context);
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

  const scanInfo: ResolverInfo = { signal: new AbortController().signal };

  // When allowedTypes is provided, limit scanning to those resolvers only.
  const resolverEntries = Object.entries(state.resolvers).filter(
    ([typeName]) => allowedTypes === undefined || allowedTypes.has(typeName),
  );

  for (const [typeName, resolver] of resolverEntries) {
    try {
      const id = resolver.id(value);
      const loaded = await resolver.load(id, state.context, scanInfo);

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
    `Cannot resolve entity type for value: ${valueDesc}. Provide resolveType, or provide a matching resolver id/load pair.${contextMessage}`,
  );
}
