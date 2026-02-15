import type { EntityRef } from "./EntityRef";

export function parseEntityRefKey(value: unknown): EntityRef | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const separator = value.indexOf(":");
  if (separator <= 0 || separator === value.length - 1) {
    return undefined;
  }

  return {
    type: value.slice(0, separator),
    id: value.slice(separator + 1),
  };
}
