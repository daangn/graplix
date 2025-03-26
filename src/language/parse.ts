import { transformer } from "@openfga/syntax-transformer";
import type { BaseEntityTypeMap } from "BaseEntityTypeMap";
import type { GraplixSchema } from "../GraplixSchema";
import { validate } from "./validate";

export function parse<T extends BaseEntityTypeMap>(
  input: string,
): GraplixSchema<T> {
  const graplixSchema: Record<string, {}> = {};
  const ast = transformer.transformDSLToJSONObject(input);

  validate(ast);

  for (const typeDefinition of ast.type_definitions) {
    graplixSchema[typeDefinition.type] = {};
  }

  return graplixSchema as GraplixSchema<T>;
}
