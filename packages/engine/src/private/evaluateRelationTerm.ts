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

    for (const candidate of relationValues) {
      if (state.trace !== undefined) {
        const edge = {
          from: object,
          relation: currentRelation,
          to: candidate,
        };

        state.trace.exploredEdges.push(edge);
        state.trace.currentPath.push(edge);
      }

      if (entityMatches(candidate, user)) {
        if (state.trace !== undefined && state.trace.matchedPath === null) {
          state.trace.matchedPath = [...state.trace.currentPath];
        }

        return true;
      }

      state.trace?.currentPath.pop();
    }

    return false;
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
      if (state.trace !== undefined) {
        const edge = {
          from: object,
          relation: term.source,
          to: sourceRef,
        };

        state.trace.exploredEdges.push(edge);
        state.trace.currentPath.push(edge);
      }

      if (await evaluateRelation(state, sourceRef, term.relation, user)) {
        return true;
      }

      state.trace?.currentPath.pop();
    }

    return false;
  }

  return false;
}
