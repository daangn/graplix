/**
 * Canonical entity reference key accepted by engine queries.
 *
 * Format: `${type}:${id}`.
 */
export type QueryEntityInput = `${string}:${string}`;

/**
 * Input payload for relation checks and explanations.
 */
export interface Query<TRootContext = object> {
  readonly user: QueryEntityInput;
  readonly object: QueryEntityInput;
  readonly relation: string;
  readonly context?: TRootContext;
}
