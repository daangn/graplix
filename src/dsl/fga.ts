import { transformer } from "@openfga/syntax-transformer";

export function fga([data]: TemplateStringsArray): ReturnType<
  typeof transformer.transformDSLToJSONObject
> {
  // TODO: validate the model
  return transformer.transformDSLToJSONObject(data);
}
