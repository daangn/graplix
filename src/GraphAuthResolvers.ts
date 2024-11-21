import type { BaseNodeTypeMap } from "./BaseNodeTypeMap";
import type { Arrayable, Nullable } from "./utils";

export type GraphAuthResolverDefinition<
  Context extends {},
  NodeTypeMap extends BaseNodeTypeMap,
  SelectedNodeTypeName extends Extract<keyof NodeTypeMap, string>,
  TargetNodeTypeName extends Extract<keyof NodeTypeMap, string>,
> = TargetNodeTypeName extends Extract<keyof NodeTypeMap, string>
  ? {
      type: TargetNodeTypeName;
      resolve: (
        node: NodeTypeMap[SelectedNodeTypeName],
        context: Context,
      ) =>
        | Promise<Nullable<NodeTypeMap[TargetNodeTypeName]>>
        | Promise<Array<NodeTypeMap[TargetNodeTypeName]>>;
    }
  : never;

export type GraphAuthResolvers<
  Context extends {},
  NodeTypeMap extends BaseNodeTypeMap,
> = {
  [SelectedNodeTypeName in Extract<keyof NodeTypeMap, string>]: {
    [name: string]: Arrayable<
      GraphAuthResolverDefinition<
        Context,
        NodeTypeMap,
        SelectedNodeTypeName,
        Extract<keyof NodeTypeMap, string>
      >
    >;
  };
};
