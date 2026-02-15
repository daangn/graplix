import type { EntityRef } from "./EntityRef";

export function isEntityRef(value: unknown): value is EntityRef {
  if (value === null || typeof value !== "object") {
    return false;
  }

  return (
    "type" in value &&
    "id" in value &&
    typeof (value as { type: unknown }).type === "string" &&
    typeof (value as { id: unknown }).id === "string"
  );
}
