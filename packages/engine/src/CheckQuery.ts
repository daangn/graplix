export type CheckEntityInput = `${string}:${string}`;

export interface CheckQuery<TRootContext = object> {
  readonly user: CheckEntityInput;
  readonly object: CheckEntityInput;
  readonly relation: string;
  readonly context?: TRootContext;
}
