# Graplix

Graplix는 **ReBAC(Relation-Based Access Control)**를 위한 선언형 DSL입니다.
`.graplix` 스키마로 정책을 선언하고, 런타임에서 사용자 제공 `resolver`와 결합해 `check()`로 권한 판정을 합니다.

## 패키지 구성

- `packages/language` — `.graplix` 파서/검증 패키지
- `packages/graplix-vscode-extension` — 언어 서버 및 구문 강조 지원
- `packages/engine` — 런타임 체크 엔진 (`@graplix/engine`)

## 빠른 시작

```ts
import { createEngine } from "@graplix/engine";

const { check } = createEngine({
  schema: `
    type user

    type repository
      relations
        define owner: [user]
        define can_edit: owner
  `,
  resolvers: {
    repository: {
      id(repo) {
        return repo.id;
      },
      async load(id) {
        return null;
      },
      relations: {
        owner(repo) {
          return repo.ownerIds.map((id: string) => ({ type: "user", id }));
        },
      },
    },
  },
});

const allowed = await check({
  user: { type: "user", id: "u1" },
  object: { type: "repository", id: "repo-1" },
  relation: "can_edit",
});
```

`check`는 항상 `Promise<boolean>`을 반환하며, 객체/주체/관계를 기준으로 관계식(`or`, `from`)을 평가합니다.

## 로드맵

- `graplix/codegen` CLI 및 타입 생성기
- 런타임 에러 정책 정교화(타임아웃/재시도/세밀한 에러 매핑)
- 확장된 relation 연산자 지원
