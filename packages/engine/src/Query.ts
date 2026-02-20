/**
 * Input payload for relation checks and explanations.
 *
 * `TEntityInput` defines the accepted type for `user` and `object`.
 * Use the codegen-generated `GraplixEntityInput` to pass mapper entity types directly.
 */
export interface Query<TContext = object, TEntityInput = never> {
  readonly user: TEntityInput;
  readonly object: TEntityInput;
  readonly relation: string;
  readonly context: TContext;
}
