declare module "react-mermaid2" {
  import type React from "react";

  interface MermaidProps {
    chart: string;
    config?: Record<string, any>;
  }

  const Mermaid: React.FC<MermaidProps>;

  export default Mermaid;
}
