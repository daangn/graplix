import { transformer } from "@openfga/syntax-transformer";
import { validate } from "./validate";

export function fga([data]: TemplateStringsArray): ReturnType<
  typeof transformer.transformDSLToJSONObject
> {
  const ast = transformer.transformDSLToJSONObject(data);
  validate(ast);

  return ast;
}
