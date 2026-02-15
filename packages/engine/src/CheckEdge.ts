import type { QueryEntityInput } from "./Query";

export interface CheckEdge {
  readonly from: QueryEntityInput;
  readonly relation: string;
  readonly to: QueryEntityInput;
}
