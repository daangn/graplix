import { parse } from "./parse";

export function fga([data]: TemplateStringsArray) {
  return parse(data);
}
