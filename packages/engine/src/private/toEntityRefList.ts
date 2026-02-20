import type { EntityRef } from "../EntityRef";
import type { InternalState } from "./InternalState";
import { toEntityRef } from "./toEntityRef";

export function toEntityRefList<TContext>(
  state: InternalState<TContext>,
  value: unknown,
  allowedTargetTypes?: ReadonlySet<string>,
): readonly EntityRef[] {
  if (value === null || value === undefined) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];
  const resolved: EntityRef[] = [];

  for (const entry of values) {
    let ref: EntityRef;
    try {
      ref = toEntityRef(entry, state);
    } catch (error) {
      state.onError?.(error);
      continue;
    }

    // Guard against resolveType returning a type outside the schema-defined
    // allowed set for this relation. Entities with unexpected types are skipped.
    if (allowedTargetTypes !== undefined && !allowedTargetTypes.has(ref.type)) {
      continue;
    }

    resolved.push(ref);
  }

  return resolved;
}
