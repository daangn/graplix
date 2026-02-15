import type { EntityRef } from "./EntityRef";
import { getStateKey } from "./getStateKey";
import type { InternalState } from "./InternalState";

export async function loadEntity<TContext>(
  state: InternalState<TContext>,
  object: EntityRef,
): Promise<unknown | null> {
  const cacheKey = getStateKey(object.type, object.id);
  if (state.entityCache.has(cacheKey)) {
    return state.entityCache.get(cacheKey) ?? null;
  }

  const resolver = state.resolvers[object.type];
  if (resolver === undefined) {
    return null;
  }

  const loaded = await resolver.load(object.id, state.context);
  state.entityCache.set(cacheKey, loaded);

  return loaded;
}
