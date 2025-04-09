import type { GraplixSchema } from "graplix";
import type { Edge, Node } from "reactflow";

/**
 * Graplix 스키마를 React Flow 데이터 구조로 변환하는 함수
 */
export function generateReactFlowData(schema: GraplixSchema<any>): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 노드 위치 계산을 위한 초기값
  const initialX = 50;
  const initialY = 50;
  const xGap = 250;
  const yGap = 100;

  // 각 엔티티 타입에 대한 노드 생성
  let index = 0;
  for (const entityType of Object.keys(schema)) {
    nodes.push({
      id: entityType,
      data: { label: entityType },
      position: { x: initialX, y: initialY + index * yGap },
      type: "default",
    });
    index++;
  }

  // 각 엔티티 타입의 관계 추가
  for (const [entityType, relations] of Object.entries(schema)) {
    // 모든 관계 속성 순회
    for (const [relationName, relationDef] of Object.entries(relations)) {
      // 직접적인 타입 관계 (기본 엔티티 관계)
      if (typeof relationDef === "object" && "type" in relationDef) {
        edges.push({
          id: `${entityType}-${relationName}-${relationDef.type}`,
          source: entityType,
          target: relationDef.type,
          label: relationName,
          type: "default",
          animated: false,
        });
      }

      // 권한 규칙 배열 (can_view, can_edit, can_delete 등)
      if (Array.isArray(relationDef)) {
        let ruleIndex = 0;
        for (const rule of relationDef) {
          // 관계 대상 타입 찾기
          let targetType = "";
          if (rule.when && schema[entityType][rule.when]) {
            targetType = schema[entityType][rule.when].type;
          }

          if (rule.from) {
            // 간접 관계 표현
            const intermediatePath = `${rule.from}/${rule.when}`;
            // 중간 엔티티 찾기
            const intermediateType =
              schema[entityType][rule.from]?.type || "Unknown";

            edges.push({
              id: `${entityType}-${relationName}-via-${intermediatePath}-${ruleIndex}`,
              source: entityType,
              target: intermediateType,
              label: `${relationName} via ${intermediatePath}`,
              type: "step",
              animated: true,
              style: { strokeDasharray: "5, 5" },
            });
          } else {
            // 직접 관계 표현
            edges.push({
              id: `${entityType}-${relationName}-when-${rule.when}-${ruleIndex}`,
              source: entityType,
              target: targetType,
              label: `${relationName} when ${rule.when}`,
              type: "step",
              animated: true,
              style: { strokeDasharray: "5, 5" },
            });
          }
          ruleIndex++;
        }
      }
    }
  }

  // 노드 위치 자동 계산 (간단한 레이아웃)
  // 각 노드를 가로로 배치하고 간선을 기반으로 y 위치 조정
  const nodePositions = new Map();

  // 초기 위치 설정
  for (const node of nodes) {
    nodePositions.set(node.id, { level: 0, processed: false });
  }

  // 엣지를 사용하여 레벨 계산
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of edges) {
      const sourcePos = nodePositions.get(edge.source);
      const targetPos = nodePositions.get(edge.target);

      if (sourcePos && targetPos) {
        if (targetPos.level <= sourcePos.level) {
          targetPos.level = sourcePos.level + 1;
          changed = true;
        }
      }
    }
  }

  // 최종 위치 적용
  for (const node of nodes) {
    const pos = nodePositions.get(node.id);
    if (pos) {
      node.position = {
        x: initialX + pos.level * xGap,
        y:
          initialY +
          Array.from(nodePositions.values())
            .filter((p) => p.level === pos.level)
            .findIndex((p) => p === pos) *
            yGap,
      };
    }
  }

  return { nodes, edges };
}
