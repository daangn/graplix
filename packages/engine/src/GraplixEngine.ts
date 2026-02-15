import type { CheckExplainResult } from "./CheckExplainResult";
import type { Query } from "./Query";

export interface GraplixEngine<TContext = object> {
  check(query: Query<TContext>): Promise<boolean>;
  explain(query: Query<TContext>): Promise<CheckExplainResult>;
}
