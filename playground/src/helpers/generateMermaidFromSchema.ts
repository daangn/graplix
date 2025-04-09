import type { GraplixSchema } from "graplix";

/**
 * Graplix 스키마를 Mermaid 그래프 코드로 변환하는 함수
 */
export function generateMermaidFromSchema(schema: GraplixSchema<any>): string {
  // Mermaid 코드의 시작, 헤더만 추가
  let mermaidCode = "graph TD\n";

  // 각 엔티티 타입에 대한 노드 정의
  for (const entityType of Object.keys(schema)) {
    // 각 노드를 별도의 줄에 정의
    mermaidCode += `    ${entityType}[${entityType}]\n`;
  }

  // 각 엔티티 타입의 관계 추가
  for (const [entityType, relations] of Object.entries(schema)) {
    // 모든 관계 속성 순회
    for (const [relationName, relationDef] of Object.entries(relations)) {
      // 직접적인 타입 관계 (기본 엔티티 관계)
      if (typeof relationDef === "object" && "type" in relationDef) {
        // 각 관계를 별도의 줄에 추가
        mermaidCode += `    ${entityType} -->|${relationName}| ${relationDef.type}\n`;
      }

      // 권한 규칙 배열 (can_view, can_edit, can_delete 등)
      if (Array.isArray(relationDef)) {
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

            // 관계를 직접 mermaidCode에 추가
            mermaidCode += `    ${entityType} -.->|${relationName} via ${intermediatePath}| ${intermediateType}\n`;
          } else {
            // 직접 관계 표현
            mermaidCode += `    ${entityType} -.->|${relationName} when ${rule.when}| ${targetType}\n`;
          }
        }
      }
    }
  }

  return mermaidCode;
}
