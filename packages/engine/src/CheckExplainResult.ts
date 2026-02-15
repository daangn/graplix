import type { CheckEdge } from "./CheckEdge";

export interface CheckExplainResult {
  readonly allowed: boolean;
  readonly matchedPath: readonly CheckEdge[] | null;
  readonly exploredEdges: readonly CheckEdge[];
}
