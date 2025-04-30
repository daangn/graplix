import type { GraplixComputedSetRelationDefinition } from "GraplixSchema";
import type { ValidatedUserset } from "language/ValidatedModel";

export function getComputedSetRelations(
  userSet: ValidatedUserset,
): GraplixComputedSetRelationDefinition | undefined {
  if (userSet.computedUserset?.relation)
    return {
      when: userSet.computedUserset.relation,
    };

  return undefined;
}
