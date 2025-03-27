import type {
  Metadata,
  RelationMetadata,
  RelationReference,
  TypeDefinition,
  Userset,
} from "@openfga/sdk";

export type ValidatedModel = {
  schema_version: string;
  type_definitions: Array<ValidatedTypeDefinition>;
};

type ValidatedTypeDefinition = Omit<
  TypeDefinition,
  "relations" | "metadata"
> & {
  relations?: {
    [key: string]: ValidatedUserset;
  };
  metadata?: ValidatedMetadata;
};

type ValidatedUserset = Omit<Userset, "intersection" | "difference"> & {
  intersection?: never;
  difference?: never;
};

type ValidatedMetadata = Omit<Metadata, "relations"> & {
  relations?: {
    [key: string]: ValidatedRelationMetadata;
  };
};

export type ValidatedRelationMetadata = Omit<
  RelationMetadata,
  "directly_related_user_types"
> & {
  directly_related_user_types?: [Omit<RelationReference, "wildcard">];
};
