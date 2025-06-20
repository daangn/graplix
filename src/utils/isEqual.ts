export function isEqual<T>(identify: (t: T) => string, a: T, b: T): boolean {
  const aid = identify(a);
  const bid = identify(b);

  return aid === bid;
}
