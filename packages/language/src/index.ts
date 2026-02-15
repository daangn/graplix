/**
 * @urlspec/language - Core language implementation for URLSpec
 */

// Export Langium-generated AST types
export * from "./__generated__/ast";

// Export AST builder
export * from "./ast-builder";

// Export parser
export { parse, parseFile } from "./parser";

// Export printer
export { print } from "./printer";

// Export resolved types
export type {
  ResolvedPage,
  ResolvedParameter,
  ResolvedParamType,
  ResolvedPathSegment,
  ResolvedType,
  ResolvedURLSpec,
} from "./resolved-types";

// Export resolver
export { resolve } from "./resolver";

// Export services
export { createURLSpecServices } from "./services";
