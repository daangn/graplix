import type { BaseEntityTypeMap } from "./BaseEntityTypeMap";
import type { GraplixResolvers } from "./GraplixResolvers";
import type { GraplixSchema } from "./GraplixSchema";
import type { ValueOf } from "./utils";

export type GraplixInput<
  Context extends {},
  EntityTypeMap extends BaseEntityTypeMap,
> = {
  schema: GraplixSchema<EntityTypeMap>;
  resolvers: GraplixResolvers<Context, EntityTypeMap>;
  identify: (entity: ValueOf<EntityTypeMap>) => {
    type: Extract<keyof EntityTypeMap, string>;
    id: string;
  };
};
