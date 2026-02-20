import type { EntityRef } from "./EntityRef";

/**
 * Directed relation edge observed while evaluating a query.
 */
export interface CheckEdge {
  readonly from: EntityRef;
  readonly relation: string;
  readonly to: EntityRef;
}
