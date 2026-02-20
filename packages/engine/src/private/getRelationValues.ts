import type { EntityRef } from "../EntityRef";
import type { ResolverInfo } from "../ResolverInfo";
import { getStateKey } from "./getStateKey";
import type { InternalState } from "./InternalState";
import { loadEntity } from "./loadEntity";
import { toEntityRefList } from "./toEntityRefList";
import { withTimeout } from "./withTimeout";

export async function getRelationValues<TContext>(
  state: InternalState<TContext>,
  object: EntityRef,
  relation: string,
  allowedTargetTypes?: ReadonlySet<string>,
): Promise<readonly EntityRef[]> {
  const cacheKey = getStateKey(object.type, object.id, relation);
  const cached = state.relationValuesCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const resolver = state.resolvers[object.type];
  if (resolver === undefined || resolver.relations === undefined) {
    return [];
  }

  const relationResolver = resolver.relations[relation];
  if (relationResolver === undefined) {
    return [];
  }

  const loadedObject = await loadEntity(state, object);
  if (loadedObject === null) {
    return [];
  }

  const controller = new AbortController();
  const info: ResolverInfo = { signal: controller.signal };

  let relationPromise = Promise.resolve(
    relationResolver(loadedObject, state.context, info),
  );
  if (state.resolverTimeoutMs !== undefined) {
    const timed = withTimeout(
      relationPromise,
      state.resolverTimeoutMs,
      `${object.type}.relations.${relation}`,
    );
    timed.catch(() => controller.abort());
    relationPromise = timed;
  }

  const relationResult = await relationPromise;
  const normalizedValues = toEntityRefList(
    state,
    relationResult,
    allowedTargetTypes,
  );

  state.relationValuesCache.set(cacheKey, normalizedValues);

  return normalizedValues;
}
