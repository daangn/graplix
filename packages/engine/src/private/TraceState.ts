import type { CheckEdge } from "../CheckEdge";

export interface TraceState {
  readonly exploredEdges: CheckEdge[];
  readonly currentPath: CheckEdge[];
  matchedPath: CheckEdge[] | null;
}
