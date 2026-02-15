import type { EntityRef } from "../EntityRef";
import { parseEntityRefKey } from "./parseEntityRefKey";

export function requireEntityRefKey(value: string, field: string): EntityRef {
  const parsed = parseEntityRefKey(value);

  if (parsed === undefined) {
    throw new Error(
      `Invalid check.${field} value. Expected "type:id" string, received: ${value}`,
    );
  }

  return parsed;
}
