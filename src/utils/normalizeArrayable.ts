import type { Arrayable } from "./Arrayable";

export function normalizeArrayable<T>(x: Arrayable<T> | undefined | null): T[] {
  if (x == null) {
    return [];
  }
  if (Array.isArray(x)) {
    return x;
  }
  return [x];
}
