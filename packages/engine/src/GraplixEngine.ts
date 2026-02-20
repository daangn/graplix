import type { CheckExplainResult } from "./CheckExplainResult";
import type { Query } from "./Query";

/**
 * Runtime API for Graplix relation evaluation.
 */
export interface GraplixEngine<TContext = object, TEntityInput = never> {
  /**
   * Returns whether `user` has `relation` on `object`.
   */
  check(query: Query<TContext, TEntityInput>): Promise<boolean>;

  /**
   * Returns check result plus traversal details for debugging.
   */
  explain(query: Query<TContext, TEntityInput>): Promise<CheckExplainResult>;
}
