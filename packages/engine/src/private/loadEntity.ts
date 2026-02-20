import type { ResolverInfo } from "../ResolverInfo";
import type { EntityRef } from "./EntityRef";
import { getStateKey } from "./getStateKey";
import type { InternalState } from "./InternalState";
import { withTimeout } from "./withTimeout";

export async function loadEntity<TContext>(
  state: InternalState<TContext>,
  ref: EntityRef,
): Promise<unknown | null> {
  const cacheKey = getStateKey(ref.type, ref.id);
  const cached = state.entityCache.get(cacheKey);
  if (cached !== undefined) {
    return cached.value;
  }

  const resolver = state.resolvers[ref.type];
  if (resolver === undefined) {
    return null;
  }

  const controller = new AbortController();
  const info: ResolverInfo = { signal: controller.signal };

  let loadPromise = resolver.load(ref.id, state.context, info);
  if (state.resolverTimeoutMs !== undefined) {
    const timed = withTimeout(
      loadPromise,
      state.resolverTimeoutMs,
      `${ref.type}.load("${ref.id}")`,
    );
    timed.catch(() => controller.abort());
    loadPromise = timed;
  }

  const loaded = await loadPromise;
  state.entityCache.set(cacheKey, { value: loaded });

  return loaded;
}
