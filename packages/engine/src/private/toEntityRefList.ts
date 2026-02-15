import type { EntityRef } from "./EntityRef";
import type { InternalState } from "./InternalState";
import { toEntityRef } from "./toEntityRef";

export async function toEntityRefList<TContext>(
  state: InternalState<TContext>,
  value: unknown,
  allowedTargetTypes?: ReadonlySet<string>,
): Promise<readonly EntityRef[]> {
  if (value === null || value === undefined) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];
  const resolved: EntityRef[] = [];

  for (const entry of values) {
    const ref = await toEntityRef(entry, state);

    if (allowedTargetTypes !== undefined && !allowedTargetTypes.has(ref.type)) {
      continue;
    }

    resolved.push(ref);
  }

  return resolved;
}
