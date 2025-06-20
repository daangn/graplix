export function compileNodeId(args: { type: string; id: string }) {
  return `${args.type}:${args.id}`;
}
