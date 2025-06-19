import { parse } from "./parse";

describe("parse", () => {
  test("it should parse basic type definition", () => {
    const input = `
      model
        schema 1.1

      type user
    `;

    const result = parse(input);

    expect(result).toEqual({
      user: {},
    });
  });

  test("it should not parse comments", () => {
    const input = `
      model
        schema 1.1

      type user # this is a comment
    `;

    const result = parse(input);

    expect(result).toEqual({
      user: {},
    });
  });

  test("it should parse relations with directly related user types", () => {
    const input = `
      model
        schema 1.1

      type user

      type team
        relations
          define member: [user]
    `;

    const result = parse(input);

    expect(result).toEqual({
      user: {},
      team: { member: { type: "user" } },
    });
  });

  test("it should parse computed set relations", () => {
    const input = `
      model
        schema 1.1

      type user

      type team
        relations
          define member: [user]
          define admin: member
    `;

    const result = parse(input);

    expect(result).toEqual({
      user: {},
      team: {
        member: { type: "user" },
        admin: [{ when: "member" }],
      },
    });
  });

  test("it should parse 'or' operator in relations", () => {
    const input = `
      model
        schema 1.1

      type user

      type team
        relations
          define member: [user]
          define editor: [user]
          define admin: member or editor
    `;

    const result = parse(input);

    expect(result).toEqual({
      user: {},
      team: {
        member: { type: "user" },
        editor: { type: "user" },
        admin: [{ when: "member" }, { when: "editor" }],
      },
    });
  });

  test("it should parse tuple to userset relations", () => {
    const input = `
      model
        schema 1.1

        type user
        
        type folder
          relations
            define viwer: [user]

        type document
          relations
            define parent_folder: [folder]
            define can_view: viwer from parent_folder
    `;

    const result = parse(input);

    expect(result).toEqual({
      user: {},
      folder: { viwer: { type: "user" } },
      document: {
        parent_folder: { type: "folder" },
        can_view: [{ when: "viwer", from: "parent_folder" }],
      },
    });
  });

  test("it should parse parenthesized relations", () => {
    const input = `
      model
        schema 1.1

      type user
      
      type team
        relations
          define member: [user]
          define admin: member
          define viewer: member
          define editor: (member or admin) or viewer
    `;

    const result = parse(input);

    expect(result).toEqual({
      user: {},
      team: {
        member: { type: "user" },
        admin: [{ when: "member" }],
        viewer: [{ when: "member" }],
        editor: [{ when: "member" }, { when: "admin" }, { when: "viewer" }],
      },
    });
  });
});
