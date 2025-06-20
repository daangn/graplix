export function filterNonError<T>(arr: (T | Error)[]): T[] {
  return arr.filter((item): item is T => !(item instanceof Error));
}
