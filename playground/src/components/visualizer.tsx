import { parse } from "graplix";
import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  type Edge,
  type Node,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  type NodeChange,
  type EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { generateReactFlowData } from "@helpers/generate-react-flow-data";
import { getElkLayout } from "@helpers/get-elk-layout";

interface VisualizerProps {
  code: string;
}

/**
 * WIP
 */
function SchemaFlow({ code }: VisualizerProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  useEffect(() => {
    try {
      const newSchema = parse(code);
      const { nodes, edges } = generateReactFlowData(newSchema);

      getElkLayout({
        nodes,
        edges,
      }).then(({ nodes, edges }) => {
        setNodes(nodes);
        setEdges(edges);
      });

      // 디버깅용 출력
      console.log("생성된 노드:", nodes);
      console.log("생성된 엣지:", edges);
    } catch (error) {
      console.error("스키마 파싱 오류:", error);
    }
  }, [code]);

  // 뷰 조정 핸들러
  const onInit = useCallback((reactFlowInstance: any) => {
    reactFlowInstance.fitView({ padding: 0.2 });
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      attributionPosition="bottom-right"
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onInit={onInit}
    >
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  );
}

// 메인 컴포넌트를 ReactFlowProvider로 감싸기
export function Visualizer(props: VisualizerProps) {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <SchemaFlow {...props} />
      </ReactFlowProvider>
    </div>
  );
}
