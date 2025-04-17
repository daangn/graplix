import { useTheme } from "@/components/ui";
import { generateMermaidSyntax } from "@/helpers/generate-mermaid-syntax";
import type { GraplixSchema } from "graplix";
import Mermaid from "mermaid-react";
import { useEffect, useState } from "react";

interface MermaidVisualizerProps {
  schema: GraplixSchema<any>;
}

export function MermaidVisualizer({ schema }: MermaidVisualizerProps) {
  const { isDark } = useTheme();
  const [mermaidContent, setMermaidContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mermaidSyntax = generateMermaidSyntax(schema, isDark);
    setMermaidContent(mermaidSyntax);
    setError(null);
  }, [schema, isDark]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive p-4">
        <p>Error generating diagram: {error}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-4 overflow-auto">
      {mermaidContent ? (
        <Mermaid
          mmd={mermaidContent}
          id="graplix-schema-diagram"
          className="w-full h-full flex items-center justify-center"
        />
      ) : (
        <div className="text-gray-400">No diagram to display</div>
      )}
    </div>
  );
}
