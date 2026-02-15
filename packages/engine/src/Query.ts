export type QueryEntityInput = `${string}:${string}`;

export interface Query<TRootContext = object> {
  readonly user: QueryEntityInput;
  readonly object: QueryEntityInput;
  readonly relation: string;
  readonly context?: TRootContext;
}
