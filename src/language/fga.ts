import type { BaseEntityTypeMap } from "BaseEntityTypeMap";
import type { GraplixSchema } from "GraplixSchema";
import { parse } from "./parse";

export function fga([
  data,
]: TemplateStringsArray): GraplixSchema<BaseEntityTypeMap> {
  return parse(data);
}
