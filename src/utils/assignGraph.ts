import type { DirectedGraph } from "graphology";

function safe<T>(cb: () => T) {
  try {
    return cb();
  } catch {
    return null;
  }
}

export function assignGraph<
  NodeAttributes extends { matched: boolean },
  EdgeAttributes extends {},
>(
  a: DirectedGraph<NodeAttributes, EdgeAttributes>,
  b: DirectedGraph<NodeAttributes, EdgeAttributes>,
): void {
  b.forEachNode((node, attrs) => {
    try {
      a.addNode(node, attrs);
    } catch {}

    const prevAttrs = safe(() => a.getNodeAttributes(node));
    a.setNodeAttribute(node, "matched", prevAttrs?.matched || attrs.matched);
  });

  b.forEachEdge((key, attributes, source, target) => {
    try {
      a.addDirectedEdge(source, target, attributes);
    } catch {}
  });
}
