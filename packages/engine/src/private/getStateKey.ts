export function getStateKey(
  type: string,
  id: string,
  relation?: string,
): string {
  const params = new URLSearchParams([
    ["t", type],
    ["i", id],
  ]);
  if (relation !== undefined) {
    params.append("r", relation);
  }
  return params.toString();
}
