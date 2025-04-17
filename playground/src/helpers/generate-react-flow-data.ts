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

      // 권한 규칙 배열
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

            // edges.push({
            //   id: `${entityType}-${relationName}-via-${intermediatePath}-${ruleIndex}`,
            //   source: entityType,
            //   target: intermediateType,
            //   label: `${relationName} via ${intermediatePath}`,
            //   type: "step",
            //   animated: true,
            //   style: { strokeDasharray: "5, 5" },
            // });
            edges.push({
              id: `${entityType}-${relationName}-${intermediateType}`,
              source: entityType,
              target: intermediateType,
              label: relationName,
              type: "default",
              animated: false,
            });
          } else {
            edges.push({
              id: `${entityType}-${relationName}-${targetType}`,
              source: entityType,
              target: targetType,
              label: relationName,
              type: "default",
              animated: false,
            });
            // 직접 관계 표현
            // edges.push({
            //   id: `${entityType}-${relationName}-when-${rule.when}-${ruleIndex}`,
            //   source: entityType,
            //   target: targetType,
            //   label: `${relationName} when ${rule.when}`,
            //   type: "step",
            //   animated: true,
            //   style: { strokeDasharray: "5, 5" },
            // });
          }
          ruleIndex++;
        }
      }
    }
  }

  return { nodes, edges };
}
