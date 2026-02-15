import type { CheckQuery } from "./CheckQuery";

export interface GraplixEngine<TContext = object> {
  check(query: CheckQuery<TContext>): Promise<boolean>;
}
