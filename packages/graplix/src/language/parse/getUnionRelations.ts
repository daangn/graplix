import type { GraplixUnionRelationDefinition } from "../../GraplixSchema";
import type { ValidatedUserset } from "../ValidatedModel";
import { getComputedSetRelations } from "./getComputedSetRelations";
import { getTupleToUsersetRelations } from "./getTupleToUsersetRelations";

export function getUnionRelations(
  userSet: ValidatedUserset,
  computedUsersets: GraplixUnionRelationDefinition[] = [],
): GraplixUnionRelationDefinition[] {
  const computedUserset = getComputedSetRelations(userSet);
  const tupleToUserset = getTupleToUsersetRelations(userSet);

  if (computedUserset) {
    computedUsersets.push(computedUserset);
  }

  if (tupleToUserset) {
    computedUsersets.push(tupleToUserset);
  }

  if (userSet.union) {
    for (const child of userSet.union.child ?? []) {
      getUnionRelations(child, computedUsersets);
    }
  }

  return computedUsersets;
}
