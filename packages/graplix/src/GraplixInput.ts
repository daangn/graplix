import type { BaseEntityTypeMap } from "./BaseEntityTypeMap";
import type { GraplixResolvers } from "./GraplixResolvers";
import type { GraplixSchema } from "./GraplixSchema";

export type GraplixInput<
  Context extends {},
  EntityTypeMap extends BaseEntityTypeMap,
> = {
  schema: GraplixSchema<EntityTypeMap>;
  resolvers: GraplixResolvers<Context, EntityTypeMap>;
};
