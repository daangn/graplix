import { EntityRef } from "./EntityRef";

export function isEntityRef(value: unknown): value is EntityRef {
  return value instanceof EntityRef;
}
