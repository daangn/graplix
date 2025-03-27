import { transformer } from "@openfga/syntax-transformer";
import { MultipleUnimplementedError } from "./MultipleError";
import { validate } from "./validate";

function transformDSLToJSONObject([data]: TemplateStringsArray) {
  return transformer.transformDSLToJSONObject(data);
}

describe("validate", () => {
  test("it should not throw an error when only type is defined", () => {
    const model = transformDSLToJSONObject`
      model
        schema 1.1

      type user
  `;

    expect(() => validate(model)).not.toThrow();
  });

  test("it should not throw an error when relation is defined with only directly related user types", () => {
    const model = transformDSLToJSONObject`
        model
          schema 1.1

        type user

        type team
          relations
            define member: [user]
    `;

    expect(() => validate(model)).not.toThrow();
  });

  test("it should throw MultipleUnimplementedError when multiple directly related user types are defined", () => {
    const model = transformDSLToJSONObject`
        model
          schema 1.1

        type user

        type team
          relations
            define member: [user]

        type organization
          relations
            define viewer: [user, team]
    `;

    expect(() => validate(model)).toThrow(MultipleUnimplementedError);
  });

  test("it should not throw an error when relation is defined with computed set", () => {
    const model = transformDSLToJSONObject`
        model
          schema 1.1
          
        type user

        type team
          relations
            define member: [user]
            define admin: member
    `;

    expect(() => validate(model)).not.toThrow();
  });

  test("it should not throw an error when operator 'or' is used in relation definition", () => {
    const model = transformDSLToJSONObject`
        model
          schema 1.1

        type user

        type channel
          relations
            define follower: [user]
            define owner: [user]
            define can_view: follower or owner
      `;

    expect(() => validate(model)).not.toThrow();
  });

  test("it should throw an error when operator 'or' is used between directly related user types and computed set", () => {
    const model = transformDSLToJSONObject`
        model
          schema 1.1

        type user

        type team
          relations
            define member: [user]
            define admin: [user] or member
      `;

    expect(() => validate(model)).toThrow(MultipleUnimplementedError);
  });

  test("it should throw an error when operator 'and' is used in relation definition", () => {
    const model = transformDSLToJSONObject`
        model
          schema 1.1

        type user

        type channel
          relations
            define editor: [user]
            define reviewer: [user]
            define publisher: editor and reviewer
      `;

    expect(() => validate(model)).toThrow(MultipleUnimplementedError);
  });

  test("it should throw an error when operator 'but not' is used in relation definition", () => {
    const model = transformDSLToJSONObject`
        model
          schema 1.1

        type user

        type channel
          relations
            define editor: [user]
            define reviewer: [user]
            define publisher: editor but not reviewer
      `;

    expect(() => validate(model)).toThrow(MultipleUnimplementedError);
  });

  test("it should not throw an error when relation is defined with tuple to userset", () => {
    const model = transformDSLToJSONObject`
        model
          schema 1.1

        type team
          relations
            define parent: [organization]
            define admin: member from parent

        type organization
          relations
            define member: [user]
    `;

    expect(() => validate(model)).not.toThrow();
  });

  test("it should throw an error when type restriction relation is used in relation definition", () => {
    const model = transformDSLToJSONObject`
        model
          schema 1.1

        type user

        type team
          relations
            define member: [user]

        type organization
          relations
            define viewer: [team#member]
      `;

    expect(() => validate(model)).toThrow(MultipleUnimplementedError);
  });

  test("it should throw an error when type restriction wildcard is used in relation definition", () => {
    const model = transformDSLToJSONObject`
        model
          schema 1.1

        type user

        type team
          relations
            define member: [user]

        type organization
          relations
            define viewer: [team:*]
      `;

    expect(() => validate(model)).toThrow(MultipleUnimplementedError);
  });

  test("it should throw an error when condition is defined", () => {
    const model = transformDSLToJSONObject`
      model
        schema 1.1

        type user

        type document
          relations
            define viewer: [user with conditionX]

        condition conditionX(x: string) {
          x=="{}"
        }
    `;

    expect(() => validate(model)).toThrow(MultipleUnimplementedError);
  });

  test("it should not throw an error when parenthesized relation is used in relation definition", () => {
    const model = transformDSLToJSONObject`
        model
          schema 1.1

        type user

        type team
          relations
            define member: ([user] or allowed) or blocked
    `;

    expect(() => validate(model)).not.toThrow(MultipleUnimplementedError);
  });
});
