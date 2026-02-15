import type { QueryEntityInput } from "./Query";

/**
 * Directed relation edge observed while evaluating a query.
 */
export interface CheckEdge {
  readonly from: QueryEntityInput;
  readonly relation: string;
  readonly to: QueryEntityInput;
}
