import type { CheckEdge } from "./CheckEdge";

/**
 * Detailed check outcome including traversal edges for debugging.
 */
export interface CheckExplainResult {
  /** Final authorization decision. */
  readonly allowed: boolean;
  /** First path that satisfied the query, if any. */
  readonly matchedPath: readonly CheckEdge[] | null;
  /** All traversed edges during evaluation. */
  readonly exploredEdges: readonly CheckEdge[];
}
