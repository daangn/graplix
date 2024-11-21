import type { BaseEntityTypeMap } from "./BaseEntityTypeMap";
import type { ValueOf } from "./utils";

export type GraplixIdentifier<EntityTypeMap extends BaseEntityTypeMap> = (
  entity: ValueOf<EntityTypeMap>,
) => {
  type: Extract<keyof EntityTypeMap, string>;
  id: string;
};
