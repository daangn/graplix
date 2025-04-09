import { type GraplixSchema, parse } from "graplix";
import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  Panel,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  type NodeChange,
  type EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { generateReactFlowData } from "../helpers";

interface VisualizerProps {
  code: string;
}

function SchemaFlow({ code }: VisualizerProps) {
  const [schema, setSchema] = useState<GraplixSchema<any>>(() => parse(code));
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
      setSchema(newSchema);
      const { nodes, edges } = generateReactFlowData(newSchema);
      setNodes(nodes);
      setEdges(edges);

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
