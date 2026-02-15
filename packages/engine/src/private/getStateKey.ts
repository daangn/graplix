export function getStateKey(
  type: string,
  id: string,
  relation?: string,
): string {
  return relation === undefined ? `${type}:${id}` : `${type}:${id}:${relation}`;
}
