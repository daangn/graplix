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
- Engine: `packages/engine/src/buildEngine.ts`, `src/private/*`, `src/buildEngine.spec.ts`
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
```

### Engine (`@graplix/engine`)

```bash
yarn workspace @graplix/engine build
yarn workspace @graplix/engine test
yarn workspace @graplix/engine vitest run src/buildEngine.spec.ts
yarn workspace @graplix/engine vitest run src/buildEngine.spec.ts -t "explain"
```

### Codegen (`@graplix/codegen`)

```bash
yarn workspace @graplix/codegen build
yarn workspace @graplix/codegen test
yarn workspace @graplix/codegen codegen ./schema.graplix
yarn workspace @graplix/codegen vitest run src/generate.spec.ts
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
| `EntityRef` | `src/EntityRef.ts` (공개 export) | `class EntityRef { type, id }` — 내부 엔티티 표현. Symbol 브랜드로 고유성 보장 |
| `Query<TContext, TEntityInput>` | `src/Query.ts` | `check`/`explain` 입력. `user`, `object`는 `TEntityInput`. `context`는 필수 |
| `CheckEdge` | `src/CheckEdge.ts` | `explain` 출력의 엣지. `from`, `to`가 `EntityRef` 인스턴스 |
| `GraplixEngine<TContext, TEntityInput>` | `src/GraplixEngine.ts` | `check(query)`, `explain(query)` 메서드 |
| `BuildEngineOptions<TContext>` | `src/BuildEngineOptions.ts` | `buildEngine` 생성 옵션 |
| `ResolverInfo` | `src/ResolverInfo.ts` | resolver 호출 시 전달되는 메타. `signal: AbortSignal` 포함 |

### EntityRef 규칙

`EntityRef`는 내부 전용 클래스입니다. **공개 API(`check`/`explain`)에 EntityRef를 직접 넘기지 않습니다.** 사용자는 항상 도메인 엔티티를 `TEntityInput`으로 전달합니다.

`CheckEdge.from`/`to`는 `EntityRef` 타입이므로, explain 결과를 타입 명시적으로 다루려면 import 가능합니다.

```typescript
import type { EntityRef } from "@graplix/engine";
```

### 도메인 엔티티 전달 방식

```typescript
// ✅ 도메인 엔티티를 TEntityInput으로 직접 전달
const engine = await buildEngine<MyContext, User | Repository>({ ... });
await engine.check({
  user: userEntity,       // User 타입
  object: repoEntity,     // Repository 타입
  relation: "owner",
  context: myContext,     // TContext (필수)
});

// ❌ EntityRef 직접 전달 불가 (Query.user/object는 TEntityInput만 허용)
// ❌ "type:id" 문자열 방식 (제거됨)
```

### Resolver 인터페이스

```typescript
interface Resolver<TEntity, TContext> {
  id(entity: TEntity): string;
  load(id: string, context: TContext, info: ResolverInfo): Promise<TEntity | null>;
  relations?: {
    [relation: string]: (
      entity: TEntity,
      context: TContext,
      info: ResolverInfo,
    ) => TEntity | TEntity[] | null | Promise<...>;
  };
}
```

**relation resolver는 도메인 엔티티를 반환합니다.** EntityRef 인스턴스를 반환하지 않습니다. 엔진이 `resolveType` 또는 schema 타입 힌트(`allowedTargetTypes`)를 통해 타입을 자동 판별합니다.

### resolveType

```typescript
type ResolveType<TContext> = (value: unknown, context: TContext) => string | null;
```

- **동기 함수**이며 **필수**입니다.
- 전달된 값의 Graplix 타입명을 반환합니다. 판별 불가 시 `null` 반환.
- `null`을 반환하면 schema 타입 힌트(allowedTargetTypes) 경로로 폴백합니다.
- relation resolver 출력에는 schema에서 타입이 이미 알려져 있으므로 `resolveType`이 `null`을 반환해도 동작합니다.
- **`query.user`/`query.object`에 대해서는 반드시 올바른 타입명을 반환해야 합니다.**

```typescript
// ✅ 구조적 필드로 타입 판별
const resolveType: ResolveType<MyContext> = (value) => {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if ("reporterId" in v) return "issue";
  if ("adminIds" in v) return "organization";
  return "user";
};
```

### private/ 디렉터리 구조

```
src/
  EntityRef.ts            # class EntityRef — 내부 엔티티 표현 (public export)

src/private/
  toEntityRef.ts          # 도메인 엔티티 → EntityRef 변환 (resolveType → schema 힌트)
  toEntityRefList.ts      # 복수 값 변환 (동기)
  evaluateRelation.ts     # 관계 평가 진입점 + 사이클 감지
  evaluateRelationTerm.ts # 개별 term(direct/from) 평가
  getRelationValues.ts    # resolver 호출, 타임아웃, 캐싱
  loadEntity.ts           # 엔티티 로드 및 캐싱
  entityMatches.ts        # EntityRef 동등 비교
  getStateKey.ts          # URLSearchParams 기반 캐시 키 생성
  InternalState.ts        # 평가 중 공유 상태
  TraceState.ts           # explain용 트레이싱 상태
  ResolvedSchema.ts       # 파싱된 스키마 내부 표현
  resolveSchema.ts        # 스키마 파싱 및 검증
  withTimeout.ts          # Promise 타임아웃 유틸
```

### 평가 흐름

```
await buildEngine(options)
  └─ resolveSchema(schema)  ← 스키마 eager 파싱·검증 (실패 시 즉시 throw)

engine.check(query)
  └─ toEntityRef(query.user, state)   ← resolveType → schema 힌트 (동기)
  └─ toEntityRef(query.object, state) ← 동일
  └─ evaluateRelation(state, object, relation, user)
       └─ evaluateRelationTerm(state, term, object, user, relation)
            ├─ [direct] getRelationValues → entityMatches
            └─ [from]   getRelationValues → evaluateRelation (재귀)

getRelationValues
  └─ loadEntity(state, ref)          ← resolver.load() 호출·캐싱
  └─ relationResolver(entity, ctx, info)  ← 도메인 엔티티 반환
  └─ toEntityRefList(state, result, allowedTargetTypes)
       └─ toEntityRef(entry, state, allowedTypes)
            ├─ resolveType(entry) → EntityRef (resolveType 경로)
            └─ resolver.id(entry) → EntityRef (schema 타입 힌트 경로, load 없음)
```

### toEntityRef 타입 판별 경로

1. **`resolveType(value)`** — 항상 먼저 시도. 타입명 반환 시 `resolver.id(value)`로 EntityRef 생성.
2. **schema 타입 힌트 (`allowedTypes`)** — relation resolver 출력에만 적용. 허용 타입의 `resolver.id(value)`만 시도. `load()` 호출 없음.
3. 두 경로 모두 실패 시 에러 throw.

**`resolver.load()`는 toEntityRef 내에서 절대 호출되지 않습니다.** `load()`는 오직 `loadEntity()`에서만 사용됩니다.

### Production 옵션 (`BuildEngineOptions`)

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `schema` | `string` | — | Raw Graplix 스키마 텍스트 |
| `resolvers` | `Resolvers<TContext>` | — | 타입별 데이터 resolver 맵 |
| `resolveType` | `ResolveType<TContext>` | — | 엔티티 타입 판별 함수 (필수) |
| `resolverTimeoutMs` | `number \| undefined` | `undefined` | `load`와 relation resolver에 적용되는 타임아웃(ms). 초과 시 에러 |
| `maxCacheSize` | `number` | `500` | 요청당 LRU 캐시 최대 항목 수 |
| `onError` | `(error: unknown) => void \| undefined` | `undefined` | relation 값 해석 실패 시 호출. throw하면 check까지 전파 |

```typescript
const engine = await buildEngine<MyContext, User | Repository>({
  schema,
  resolvers,
  resolveType,
  resolverTimeoutMs: 3000,
  maxCacheSize: 1000,
  onError: (err) => console.error("Entity resolution failed:", err),
});
```

**`buildEngine`은 async 함수입니다.** 스키마를 eager하게 파싱·검증하므로, 잘못된 스키마는 `buildEngine()` 호출 시점에 즉시 reject됩니다.

**캐시 구조**: 두 캐시 모두 `lru-cache` 기반, **요청 단위**로 생성. cross-request 공유 없음.
- `entityCache` — `LRUCache<string, CachedEntity>`: `resolver.load()` 결과를 `{ value }` 형태로 박싱 (null 캐싱과 cache miss 구분)
- `relationValuesCache` — `LRUCache<string, readonly EntityRef[]>`: relation resolver 결과

### ResolverInfo

모든 `load`와 relation resolver 호출에 세 번째 인자로 전달됩니다.

```typescript
interface ResolverInfo {
  signal: AbortSignal; // resolverTimeoutMs 초과 시 abort됨
}
```

resolver 구현에서 `signal`을 구독하면 타임아웃 시 DB 쿼리 등 진행 중인 작업을 취소할 수 있습니다.

### 공개 API

`packages/engine/src/index.ts`가 유일한 공개 진입점입니다.

```typescript
export { buildEngine }           // async factory
export type { BuildEngineOptions }
export type { GraplixEngine }
export type { Query }
export type { EntityRef }        // CheckEdge.from/to 타입 명시용
export type { CheckEdge }
export type { CheckExplainResult }
export type { Resolver }
export type { Resolvers }
export type { ResolverInfo }
export type { ResolveType }
```

---

## Codegen 특이사항

- CLI 설정 탐색: `cosmiconfig` 사용 (`graplix.codegen.*`, `graplix-codegen.config.*`)
- CLI 인수가 설정 파일 값보다 우선합니다.

### 생성되는 API

codegen이 생성하는 파일의 핵심 요소:

```typescript
// 생성된 buildEngine (async)
export async function buildEngine<TContext = object>(
  options: BuildEngineOptions<TContext>,
): Promise<GraplixEngine<TContext, GraplixEntityInput>> { ... }

// TEntityInput = mapper로 등록된 타입들의 union
export type GraplixEntityInput = GraplixProvidedMapperTypes[keyof GraplixProvidedMapperTypes];

// 타입이 지정된 resolver 인터페이스
export type GraplixResolvers<TContext> = {
  [TTypeName in GraplixTypeName]: {
    id(entity: GraplixMapperTypes[TTypeName]): string;
    load(id: string, context: TContext, info: ResolverInfo): Promise<...>;
    relations?: GraplixResolverRelations<TTypeName, TContext>;
  };
};
```

mapper 없이 생성 시 `GraplixEntityInput`은 `never`이므로 mapper를 설정해야 도메인 엔티티를 직접 전달할 수 있습니다.

```typescript
// 생성 코드 사용 예시
const engine = await buildEngine({ resolvers, resolveType });

await engine.check({
  user: userEntity,   // GraplixEntityInput 타입
  object: repoEntity,
  relation: "owner",
  context: {},
});
```

---

## 코드 컨벤션

### TypeScript

- Strict 타이핑 필수. `any`, `@ts-ignore`, `@ts-expect-error` 사용 금지.
- export API에는 명시적 반환 타입 기재.
- 불변 필드에는 `readonly` 사용.
- 타입 전용 import는 `import type` 사용.
- `erasableSyntaxOnly` 활성화 — constructor parameter properties 사용 금지.

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
- 파일명: PascalCase (타입/클래스 파일), camelCase (함수 파일)
- 테스트 파일: `.spec.ts`

### 에러 처리

- 빠른 실패(fail fast), 명확한 에러 메시지.
- 빈 `catch` 블록으로 에러 무시 금지 (`onError` 콜백 활용).
- 재throw 시 컨텍스트 보존.
- 스키마 파싱/검증 에러에는 진단 텍스트 포함.

### 비동기

- `async`/`await` 선호 (`.then` 체이닝 지양).
- 테스트에서 Promise 단언은 반드시 `await` (`await expect(...).rejects...`).
- 동기로 구현 가능한 함수는 굳이 `async`로 만들지 않음 (`toEntityRef`, `toEntityRefList` 등은 동기).

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
