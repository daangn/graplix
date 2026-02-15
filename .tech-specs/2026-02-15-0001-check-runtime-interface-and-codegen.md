# Tech Spec: Resolver-driven check runtime and type-safe codegen

## 1) 배경

- 현재 저장소는 `.graplix` 스키마 파싱/검증(언어 패키지)와 VSCode 언어 지원이 완료된 상태이다.
- 다음 단계는 런타임 체크 파이프라인을 완성해 `check()`를 통해 실제 인가 판정을 제공하는 것이다.
- 이 스펙은 아래 3개 과제를 하나의 실행 계획으로 묶는다.

## 2) 목표

- 사용자 정의 resolver 인터페이스를 정의해 런타임 데이터 소스와 연결한다.
- 스키마를 기반으로 TypeScript 타입/헬퍼 코드를 생성하는 `@graplix/codegen` CLI를 정의한다.
- 스키마/resolver를 기반으로 `@graplix/engine`의 실제 `check()` 평가 엔진을 구현한다.

## 3) 요구사항

### 3-1. Resolver 인터페이스

- 스키마의 relation 이름을 기반으로, 주체 객체와 호출자 정의 컨텍스트를 받아 관련 객체군을 조회할 수 있어야 한다.
- `Resolvers`는 GraphQL의 context 패턴처럼 사용자 정의 컨텍스트 타입을 제네릭으로 받는다.
- 사용자가 제안한 형태를 기준으로 다음 타입을 기본 형태로 반영한다.

```ts
export type ResolverValue<T> = T | ReadonlyArray<T> | null;

export interface ResolverContext {
  readonly requestId?: string;
}

export interface EntityRef {
  readonly type: string;
  readonly id: string;
}

export interface TypeResolver<
  TEntity,
  TRootContext extends ResolverContext = {},
> {
  id(entity: TEntity): string;

  load(
    id: string,
    ctx: TRootContext,
  ): Promise<TEntity | null>;

  relations?: {
    [relation: string]: (
      entity: TEntity,
      ctx: TRootContext,
    ) => ResolverValue<unknown> | Promise<ResolverValue<unknown>>;
  };
}

export type Resolvers<TRootContext extends ResolverContext = {}> = {
  [typeName: string]: TypeResolver<unknown, TRootContext>;
};

export interface CheckQuery<TRootContext extends ResolverContext = {}> {
  readonly user: unknown;
  readonly relation: string;
  readonly object: unknown;
  readonly context?: TRootContext;
}
```

- 아래처럼 구성된다.

```ts
interface Context {
  readonly requestId?: string;
  readonly viewerId: string;
}

const resolvers: Resolvers<Context> = {
  user: {
    id(user) {
      return user.entityId;
    },
    async load(id, context) {
      const user = await userLoader(id);
      return user;
    },
  },
  organization: {
    id(org) {
      return org.entityId;
    },
    async load(id, context) {
      const org = await organizationLoader(id);
      return org;
    },
    relations: {
      async owner(org, context) {
        const owner = await getOwnerByOrganization(org, context);
        return owner;
      },
    },
  },
};
```

- 인터페이스는 최소형부터 시작하고, 추후 아래를 위해 확장한다.
  - `context`에 role/permission 캐시 키/trace 정보 추가
  - relation 리턴 타입의 목표 타입 분기 정밀화(코드 생성으로 relation별 반환 타입 강화)
  - 부분 응답(페이징/한도), 캐시 힌트

### 3-2. `@graplix/codegen` CLI

- 입력:
  - `.graplix` 스키마 텍스트
  - 출력 경로
- 출력:
  - 코드 생성된 type-safe Resolver 키맵(타입별 relation 타입)
  - `check()` 호출 편의를 위한 헬퍼 타입
  - 런타임과 타입 간 불일치 방지용 컴파일 체크
- 요구사항:
  - 스키마 변경 시 재생성 시점에 타입 불일치를 즉시 감지한다.
  - 최소한 스키마 문법 수준을 벗어나지 않는 생성 실패시 명시적 에러를 반환한다.

### 3-3. `check()` 동작

`@graplix/engine`의 `createEngine()`는 실행 컨텍스트에 스키마/리졸버를 한 번 주입해 `check` 함수를 반환한다.

```ts
import { createEngine } from "@graplix/engine";

const resolvers = { ... };

export const { check } = createEngine({
  schema: schemaString,
  resolvers,
});
```

- 권장 시그니처 예시

```ts
export interface GraplixRuntime<TContext extends ResolverContext = {}> {
  check<TUser = unknown, TObject = unknown>(
    query: {
      user: TUser;
      object: TObject;
      relation: string;
      context?: TContext;
    },
  ): Promise<boolean>;
}

export function createEngine<TContext extends ResolverContext = {}>(options: {
  schema: string;
  resolvers: Resolvers<TContext>;
}): GraplixRuntime<TContext>;
```

```ts
const isAuthorized = await check({
  user: req.user,
  object: page,
  relation: "can_edit",
  context,
});

const isAuthorizedWithoutContext = await check({
  user: req.user,
  object: page,
  relation: "can_view",
});
```

- 입력: `check({ user, object, relation, context })`
  - `context`는 생략 가능하며 생략 시 런타임은 기본값 `{}`를 사용한다.
  - 기본 동작에서 `context` 타입은 생성된 runtime의 `TContext`와 사용자 정의 `Resolvers<TContext>` 선언이 호환되어야 한다.
- 출력: `Promise<boolean>`
- 처리 규칙:
  - `or` 조합은 전치된 관계 중 하나라도 true면 true.
  - `X from Y`는 Y로 계산된 대상 집합에서 `X`를 전개한다.
  - 계산 중 에러는 reject 처리하거나 정책에 따른 기본값(fail-closed)을 명시.
- 비기능:
  - 순환 참조 보호(최대 깊이/방문 기록)
  - 중복 조회 제거(캐시 혹은 방문 정규화)
  - 타임아웃, 취소 정책

## 4) 구현 순서 (로드맵 반영)

1. **Resolver Interface 정립**
   - 인터페이스 최소형부터 출발해 예외/컨텍스트/캐싱 확장 포인트를 명문화
2. **`@graplix/codegen` MVP**
   - 스키마 파서 산출물(`type`/`relation`)을 기준으로 타입을 생성
   - 기본 코드 생성 검증을 통과하면 다음 단계 진입
3. **`check()` 엔진 구현**
   - relation 표현식의 실행기 (or/from)
   - 테스트 하네스 추가: 단순 참조, 중첩 from, from의 대상 다중, 순환/에러 케이스

## 5) 완료 기준

- 최소 1개 저장소 스키마에서 resolver를 통해 권한을 판정할 수 있어야 한다.
- 인가 판정 결과가 `Promise<boolean>`로 안정적으로 반환되어야 한다.
- 타입 생성물과 런타임 호출 간 타입 불일치가 컴파일 타임 또는 CI에서 확인 가능해야 한다.

## 6) 다음 액션

- 위 3개 항목 중 첫 번째(Resolver 인터페이스)부터 구현 스펙 확정 후, API 시그니처를 기준으로 `@graplix/codegen` 초안 구현을 시작한다.
