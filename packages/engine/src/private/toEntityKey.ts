import type { QueryEntityInput } from "../CheckQuery";
import type { EntityRef } from "./EntityRef";

export function toEntityKey(ref: EntityRef): QueryEntityInput {
  return `${ref.type}:${ref.id}`;
}
