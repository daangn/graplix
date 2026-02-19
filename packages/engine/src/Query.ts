import type { EntityRef } from "./private/EntityRef";

/**
 * Input payload for relation checks and explanations.
 *
 * `TEntityInput` widens the accepted type of `user` and `object` beyond `EntityRef`.
 * Use the codegen-generated `GraplixEntityInput` to allow passing mapper entity types directly.
 */
export interface Query<TContext = object, TEntityInput = never> {
  readonly user: EntityRef | TEntityInput;
  readonly object: EntityRef | TEntityInput;
  readonly relation: string;
  readonly context?: TContext;
}
