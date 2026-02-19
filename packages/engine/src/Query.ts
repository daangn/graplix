import type { EntityRef } from "./private/EntityRef";

/**
 * Input payload for relation checks and explanations.
 */
export interface Query<TContext = object> {
  readonly user: EntityRef;
  readonly object: EntityRef;
  readonly relation: string;
  readonly context?: TContext;
}
