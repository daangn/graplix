# Graplix – Claude Code Guide

## 프로젝트 개요

TypeScript-first ReBAC(Relation-Based Access Control) 툴킷. Yarn workspaces 모노레포(`yarn@4.12.0`).

```
packages/
  language/         # Langium 기반 .graplix 스키마 파서·검증기
  engine/           # 런타임 권한 평가 엔진
  codegen/          # .graplix → TypeScript 코드 생성 CLI
  vscode-extension/ # VS Code 언어 지원
```

패키지 매니저: **yarn@4.12.0** (pnpm·npm 사용 금지).

### 주요 파일 맵

- 루트: `package.json`, `tsconfig.json`, `biome.json`
- Language: `packages/language/src/graplix.langium`, `src/validator.ts`, `src/parse.ts`
- Engine: `packages/engine/src/createEngine.ts`, `src/private/*`, `src/createEngine.spec.ts`
- Codegen: `packages/codegen/src/generate.ts`, `src/cli.ts`, `src/config.ts`
- Extension: `packages/vscode-extension/src/extension.ts`, `src/language-server.ts`

---

## 빌드·테스트·포맷 명령

### 루트

```bash
yarn build    # 전체 워크스페이스 빌드 (ultra -r build)
yarn format   # Biome 포맷/린트 자동수정 (biome check --fix --unsafe)
yarn test     # 전체 테스트
```

### Language (`@graplix/language`)

```bash
yarn workspace @graplix/language langium:generate          # 문법 출력 재생성
yarn workspace @graplix/language build                     # langium:generate 후 tsdown
yarn workspace @graplix/language test
yarn workspace @graplix/language vitest run src/validator.spec.ts
yarn workspace @graplix/language vitest run src/parse.spec.ts
```

### Engine (`@graplix/engine`)

```bash
yarn workspace @graplix/engine build
yarn workspace @graplix/engine test
yarn workspace @graplix/engine vitest run src/createEngine.spec.ts
yarn workspace @graplix/engine vitest run src/createEngine.spec.ts -t "explain"
```

### Codegen (`@graplix/codegen`)

```bash
yarn workspace @graplix/codegen build
yarn workspace @graplix/codegen test
yarn workspace @graplix/codegen codegen ./schema.graplix
yarn workspace @graplix/codegen vitest run src/generate.spec.ts
yarn workspace @graplix/codegen vitest run src/generate.spec.ts -t "mapper"
```

### VS Code Extension (`graplix-vscode-extension`)

```bash
yarn workspace graplix-vscode-extension build   # 번들 빌드 및 VSIX 패키징
yarn workspace graplix-vscode-extension watch
# test 스크립트 없음
```

### 검증 순서 (권장)

1. 변경된 패키지의 테스트 실행
2. 변경된 패키지의 빌드 실행
3. 문법/언어 서비스 변경 시: `@graplix/language build` → `graplix-vscode-extension build`
4. 최종: `yarn build`

---

## Engine 패키지 아키텍처 (`packages/engine`)

### 핵심 타입

| 타입 | 위치 | 설명 |
|------|------|------|
| `EntityRef` | `src/private/EntityRef.ts` (공개 export) | `{ type: string; id: string }` – 엔티티의 정규 표현 |
| `Query<TContext, TEntityInput>` | `src/Query.ts` | `check`/`explain` 입력. `user`, `object`가 `EntityRef \| TEntityInput` |
| `CheckEdge` | `src/CheckEdge.ts` | `explain` 출력의 엣지. `from`, `to`가 `EntityRef` |
| `GraplixEngine<TContext, TEntityInput>` | `src/GraplixEngine.ts` | `check(query)`, `explain(query)` 메서드 |

### EntityRef 규칙 및 도메인 엔티티 지원

`Query.user`, `Query.object`, `CheckEdge.from`, `CheckEdge.to`는 **`EntityRef` 객체**를 사용합니다. `"type:id"` 문자열 형식은 공개 API에 존재하지 않습니다.

`Query`와 `GraplixEngine`은 두 번째 제네릭 `TEntityInput`(기본값 `never`)을 통해 도메인 엔티티를 직접 받을 수 있습니다. `TEntityInput = never`이면 `EntityRef`만 허용되고, 타입을 명시하면 `EntityRef | TEntityInput`을 모두 허용합니다.

```typescript
// ✅ EntityRef 사용 (기본)
await engine.check({
  user: { type: "user", id: "user-1" },
  object: { type: "repository", id: "repo-1" },
  relation: "owner",
});

// ✅ 도메인 엔티티 직접 전달 (TEntityInput 명시)
const engine = createEngine<MyContext, User | Repository>({ ... });
await engine.check({
  user: userEntity,       // User 타입
  object: repoEntity,     // Repository 타입
  relation: "owner",
});

// ❌ 이전 방식 (제거됨)
await engine.check({ user: "user:user-1", object: "repository:repo-1", relation: "owner" });
```

도메인 엔티티가 전달되면 내부적으로 `toEntityRef`가 `resolveType` → resolver 스캔 순서로 엔티티 타입을 추론합니다.

### private/ 디렉터리 구조

```
src/private/
  EntityRef.ts            # { type, id } 인터페이스
  isEntityRef.ts          # EntityRef 타입 가드
  toEntityRef.ts          # 임의 값(도메인 객체·string·EntityRef) → EntityRef 변환
  toEntityRefList.ts      # 복수 값 변환
  evaluateRelation.ts     # 관계 평가 진입점
  evaluateRelationTerm.ts # 개별 term(direct/from) 평가
  getRelationValues.ts    # 리졸버 호출 및 캐싱
  loadEntity.ts           # 엔티티 로드 및 캐싱
  entityMatches.ts        # EntityRef 동등 비교
  getStateKey.ts          # 캐시/방문 키 생성
  InternalState.ts        # 평가 중 공유 상태
  TraceState.ts           # explain용 트레이싱 상태
  ResolvedSchema.ts       # 파싱된 스키마 내부 표현
  resolveSchema.ts        # 스키마 파싱 및 검증
```

`parseEntityRefKey`는 `toEntityRef` 내부에서만 사용합니다. 새 코드에서 직접 호출하지 마세요.

### 평가 흐름

```
check(query)
  └─ toEntityRef(query.user)  ─┐
  └─ toEntityRef(query.object) ┤  EntityRef | TEntityInput → EntityRef
                               │  (EntityRef → 직접 사용,
                               │   도메인 객체 → resolveType → resolver 스캔)
  └─ evaluateRelation(state, object, relation, user)
       └─ evaluateRelationTerm(state, term, object, user, relation)
            ├─ [direct] getRelationValues → entityMatches
            └─ [from]   getRelationValues → evaluateRelation (재귀)
```

### 공개 API

`packages/engine/src/index.ts`가 유일한 공개 진입점입니다. 타입·함수를 추가하거나 제거할 때는 이 파일을 함께 수정합니다. `src/private/` 내 파일은 직접 export하지 않습니다 (`EntityRef`는 예외로 index.ts를 통해 re-export).

---

## Codegen 특이사항

- CLI 설정 탐색: `cosmiconfig` 사용 (`graplix.codegen.*`, `graplix-codegen.config.*`)
- CLI 인수가 설정 파일 값보다 우선합니다.
- 에디터 검증을 위해 `$schema`가 포함된 JSON 설정을 권장합니다.

### 생성되는 엔티티 입력 타입

codegen은 mapper 설정에 따라 `GraplixEntityInput`을 자동 생성합니다:

```typescript
// mapper 없음 → never (EntityRef만 허용)
export type GraplixEntityInput = GraplixProvidedMapperTypes[keyof GraplixProvidedMapperTypes];

// mapper 있을 때 (e.g. user, repository에 mapper 지정)
// GraplixEntityInput = Mapper_user | Mapper_repository
```

생성된 `createEngine`은 `GraplixEngine<TContext, GraplixEntityInput>`을 반환하므로, mapper가 등록된 타입은 `check`/`explain` 호출 시 도메인 엔티티를 직접 넘길 수 있습니다:

```typescript
// graplix.codegen.json: mappers 설정 후 생성된 코드 사용 예시
const engine = createEngine({ resolvers, resolveType });

await engine.check({
  user: userEntity,   // Mapper_user 타입 직접 전달 가능
  object: repoEntity, // Mapper_repository 타입 직접 전달 가능
  relation: "owner",
});
```

---

## 코드 컨벤션

### TypeScript

- Strict 타이핑 필수. `any`, `@ts-ignore`, `@ts-expect-error` 사용 금지.
- export API에는 명시적 반환 타입 기재.
- 불변 필드에는 `readonly` 사용.
- 타입 전용 import는 `import type` 사용.

### 포맷 (Biome)

- 들여쓰기: 스페이스 2칸.
- 문자열: 큰따옴표(`"`).
- Import 자동 정렬 활성화.
- `**/__generated__` 제외.

### Import 순서

1. `import type` (타입 전용)
2. 외부 패키지
3. 워크스페이스 패키지
4. 상대 경로

### 네이밍

- PascalCase: 인터페이스·타입·클래스
- camelCase: 변수·함수
- 파일명: lowercase, 하이픈 구분
- 테스트 파일: `.spec.ts`

### 에러 처리

- 빠른 실패(fail fast), 명확한 에러 메시지.
- 빈 `catch` 블록으로 에러 무시 금지.
- 재throw 시 컨텍스트 보존.
- 스키마 파싱/검증 에러에는 진단 텍스트 포함.

### 비동기

- `async`/`await` 선호 (`.then` 체이닝 지양).
- 테스트에서 Promise 단언은 반드시 `await` (`await expect(...).rejects...`).

---

## 생성 파일 (수동 편집 금지)

- `packages/language/src/__generated__/`
- `packages/language/syntaxes/graplix.tmLanguage.json`

문법 변경 시 `yarn workspace @graplix/language langium:generate` 실행 후 빌드합니다.

---

## Tech Spec 워크플로우

기능 명세는 `.tech-specs/`에 `YYYY-MM-DD-####-name.md` 형식으로 저장합니다. 다단계 기능은 작업 전 spec을 먼저 작성하거나 업데이트합니다.

---

## 작업 완료 전 체크리스트

1. 변경된 패키지의 테스트·빌드 실행 확인.
2. 생성 파일을 의도치 않게 편집하지 않았는지 확인.
3. 스타일/포맷 일관성 확인.
4. 검증 중 발견한 기존 이슈 언급.
