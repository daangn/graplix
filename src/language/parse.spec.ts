import { parse } from "./parse";

describe("parse", () => {
  test("should parse basic type definition", () => {
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

  test("should not parse comments", () => {
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

  test("should parse relations with directly related user types", () => {
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

  test("should parse computed set relations", () => {
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

    console.log(result);

    expect(result).toEqual({
      user: {},
      team: {
        member: { type: "user" },
        admin: [{ when: "member" }],
      },
    });
  });

  test("should parse 'or' operator in relations", () => {
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

  test("should parse tuple to userset relations", () => {
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
        can_view: { when: "viwer", from: "parent_folder" },
      },
    });
  });

  test("should parse parenthesized relations", () => {
    // Test parsing of relations with parentheses
  });

  test("should throw error for unsupported 'and' operator", () => {
    // Test error handling for 'and' operator
  });

  test("should throw error for unsupported 'but not' operator", () => {
    // Test error handling for 'but not' operator
  });

  test("should throw error for type restriction relations", () => {
    // Test error handling for type#relation syntax
  });

  test("should throw error for type restriction wildcards", () => {
    // Test error handling for type:* syntax
  });

  test("should throw error for condition definitions", () => {
    // Test error handling for condition declarations
  });
});
