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
    // Test parsing of relations that reference other relations
  });

  test("should parse 'or' operator in relations", () => {
    // Test parsing of relations using 'or' operator
  });

  test("should parse tuple to userset relations", () => {
    // Test parsing of relations using 'from' keyword
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
