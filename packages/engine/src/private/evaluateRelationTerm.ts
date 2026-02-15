import type { GraplixRelationTerm } from "@graplix/language";
import { isGraplixDirectTypes, isGraplixRelationFrom } from "@graplix/language";

import type { EntityRef } from "./EntityRef";
import { entityMatches } from "./entityMatches";
import { evaluateRelation } from "./evaluateRelation";
import { getRelationValues } from "./getRelationValues";
import type { InternalState } from "./InternalState";

export async function evaluateRelationTerm<TContext>(
  state: InternalState<TContext>,
  term: GraplixRelationTerm,
  object: EntityRef,
  user: EntityRef,
  currentRelation: string,
): Promise<boolean> {
  if (isGraplixDirectTypes(term)) {
    const allowedTargets = state.schema.types
      .get(object.type)
      ?.relations.get(currentRelation)?.directTargetTypes;
    const relationValues = await getRelationValues(
      state,
      object,
      currentRelation,
      allowedTargets,
    );

    return relationValues.some((candidate) => entityMatches(candidate, user));
  }

  if (isGraplixRelationFrom(term)) {
    if (term.source === undefined) {
      return evaluateRelation(state, object, term.relation, user);
    }

    const sourceRelationValues = await getRelationValues(
      state,
      object,
      term.source,
      undefined,
    );

    for (const sourceRef of sourceRelationValues) {
      if (await evaluateRelation(state, sourceRef, term.relation, user)) {
        return true;
      }
    }

    return false;
  }

  return false;
}
