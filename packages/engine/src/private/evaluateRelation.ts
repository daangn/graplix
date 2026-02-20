import type { EntityRef } from "../EntityRef";
import { evaluateRelationTerm } from "./evaluateRelationTerm";
import { getStateKey } from "./getStateKey";
import type { InternalState } from "./InternalState";

export async function evaluateRelation<TContext>(
  state: InternalState<TContext>,
  object: EntityRef,
  relationName: string,
  user: EntityRef,
): Promise<boolean> {
  const typeDefinition = state.schema.types.get(object.type);
  if (typeDefinition === undefined) {
    return false;
  }

  const relationDefinition = typeDefinition.relations.get(relationName);
  if (relationDefinition === undefined) {
    return false;
  }

  const visitKey = getStateKey(object.type, object.id, relationName);
  if (state.visited.has(visitKey)) {
    return false;
  }

  state.visited.add(visitKey);

  try {
    for (const term of relationDefinition.terms) {
      if (await evaluateRelationTerm(state, term, object, user, relationName)) {
        return true;
      }
    }

    return false;
  } finally {
    state.visited.delete(visitKey);
  }
}
