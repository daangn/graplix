import type { EntityRef } from "../EntityRef";

export function entityMatches(left: EntityRef, right: EntityRef): boolean {
  return left.type === right.type && left.id === right.id;
}
