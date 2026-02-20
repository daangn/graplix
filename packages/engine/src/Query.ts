/**
 * Input payload for relation checks and explanations.
 *
 * `TEntityInput` defines the accepted type for `user` and `object`.
 * Use the codegen-generated `GraplixEntityInput` to allow passing mapper entity
 * types directly, or set it to `EntityRef` to pass lightweight entity references.
 */
export interface Query<TContext = object, TEntityInput = never> {
  readonly user: TEntityInput;
  readonly object: TEntityInput;
  readonly relation: string;
  readonly context: TContext;
}
