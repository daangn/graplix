import type { GraplixTupleToUsersetRelationDefinition } from "GraplixSchema";
import type { ValidatedUserset } from "language/ValidatedModel";

export function getTupleToUsersetRelations(
  userSet: ValidatedUserset,
): GraplixTupleToUsersetRelationDefinition | undefined {
  if (
    userSet.tupleToUserset?.computedUserset.relation &&
    userSet.tupleToUserset.tupleset.relation
  )
    return {
      when: userSet.tupleToUserset.computedUserset.relation,
      from: userSet.tupleToUserset.tupleset.relation,
    };

  return undefined;
}
