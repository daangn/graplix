import type { GraplixSchema, GraplixSchemaRelationDefinition } from "graplix";

function isDirectRelationDef(obj: unknown): obj is { type: string } {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === "object" &&
    "type" in obj &&
    typeof (obj as any).type === "string"
  );
}

function isComputedRelationDef(
  obj: unknown,
): obj is { when: string; from?: string } {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === "object" &&
    "when" in obj &&
    typeof (obj as any).when === "string"
  );
}

export function generateMermaidSyntax(
  schema: GraplixSchema<any>,
  isDark: boolean,
): string {
  const lines: string[] = [];

  if (isDark) {
    lines.push(
      "%%{init: {'theme': 'dark', 'themeVariables': {'arrowheadColor': '#ffffff', 'lineColor': '#ffffff'}}}%%",
    );
  } else {
    lines.push("%%{init: {'theme': 'default'}}%%");
  }

  lines.push("graph TD");

  const types = Object.keys(schema);
  const edges: Array<{
    id: number;
    source: string;
    target: string;
    label: string;
    isComputed: boolean;
  }> = [];
  let edgeId = 0;

  lines.push("    %% Nodes");
  for (const type of types) {
    lines.push(`    ${type}["${type}"]`);
  }

  lines.push("\n    %% Relationships");
  for (const sourceType of types) {
    const relations = schema[sourceType] as Record<
      string,
      GraplixSchemaRelationDefinition<any>
    >;

    if (relations) {
      for (const [relationName, relationDef] of Object.entries(relations)) {
        const relationDefs = Array.isArray(relationDef)
          ? relationDef
          : [relationDef];

        for (const rel of relationDefs) {
          let targetType: string | null = null;
          let edgeLabel = relationName;
          let isComputed = false;

          if (isDirectRelationDef(rel)) {
            targetType = rel.type;
          } else if (isComputedRelationDef(rel)) {
            if (rel.from) {
              targetType = rel.from;
              edgeLabel = `${relationName} from ${rel.from}`;
              isComputed = true;
            }
          }

          if (targetType) {
            const currentId = edgeId++;

            lines.push(`    ${sourceType} -->|"${edgeLabel}"| ${targetType}`);

            edges.push({
              id: currentId,
              source: sourceType,
              target: targetType,
              label: edgeLabel,
              isComputed,
            });
          }
        }
      }
    }
  }

  if (edges.length > 0) {
    lines.push("\n    %% Edge Styles");

    const computedEdges = edges.filter((e) => e.isComputed);
    if (computedEdges.length > 0) {
      lines.push(
        `    linkStyle ${computedEdges.map((e) => e.id).join(",")} stroke:${
          isDark ? "#ff6e40" : "#ff5722"
        },stroke-width:2px,stroke-dasharray:5 5,color:${
          isDark ? "#ff6e40" : "#ff5722"
        }`,
      );
    }

    const directEdges = edges.filter((e) => !e.isComputed);
    if (directEdges.length > 0) {
      lines.push(
        `    linkStyle ${directEdges.map((e) => e.id).join(",")} stroke:${
          isDark ? "#fff" : "#555"
        },stroke-width:2px,color:${isDark ? "#fff" : "#555"}`,
      );
    }
  }

  lines.push("\n    %% Node Styles");
  lines.push(
    `    classDef default fill:${isDark ? "#111" : "#f9f9f9"},stroke:${
      isDark ? "#fff" : "#333"
    },stroke-width:1px,rx:4,ry:4,color:${isDark ? "#fff" : "#333"}`,
  );

  return lines.join("\n");
}
