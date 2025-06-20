import type { BaseEntityTypeMap } from "./BaseEntityTypeMap";
import type { Arrayable, Nullable } from "./utils";

export type GraplixResolverDefinition<
  Context extends {},
  EntityTypeMap extends BaseEntityTypeMap,
  SelectedNodeTypeName extends Extract<keyof EntityTypeMap, string>,
  TargetNodeTypeName extends Extract<keyof EntityTypeMap, string>,
> = TargetNodeTypeName extends Extract<keyof EntityTypeMap, string>
  ? {
      type: TargetNodeTypeName;
      resolve: (
        entity: EntityTypeMap[SelectedNodeTypeName],
        context: Context,
      ) =>
        | Promise<Nullable<EntityTypeMap[TargetNodeTypeName]>>
        | Promise<Array<EntityTypeMap[TargetNodeTypeName]>>;
    }
  : never;
export type GraplixResolvers<
  Context extends {},
  EntityTypeMap extends BaseEntityTypeMap,
> = {
  [SelectedNodeTypeName in Extract<keyof EntityTypeMap, string>]: {
    identify: (entity: EntityTypeMap[SelectedNodeTypeName]) => string;
    relations?: {
      [relationName: string]: Arrayable<
        GraplixResolverDefinition<
          Context,
          EntityTypeMap,
          SelectedNodeTypeName,
          Extract<keyof EntityTypeMap, string>
        >
      >;
    };
  };
};
