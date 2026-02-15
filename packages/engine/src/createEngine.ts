import type { GraplixDocument, GraplixRelationTerm } from "@graplix/language";
import {
  isGraplixDirectTypes,
  isGraplixRelationFrom,
  parse,
} from "@graplix/language";
import type { LangiumDocument } from "langium";

export type ResolverValue<T> = T | ReadonlyArray<T> | null;

export interface ResolverContext {
  readonly requestId?: string;
}

export interface EntityRef {
  readonly type: string;
  readonly id: string;
}

export interface TypeResolver<
  TEntity,
  TRootContext extends ResolverContext = {},
> {
  id(entity: TEntity): string;

  load(id: string, context: TRootContext): Promise<TEntity | null>;

  relations?: {
    [relation: string]: (
      entity: TEntity,
      context: TRootContext,
    ) => ResolverValue<unknown> | Promise<ResolverValue<unknown>>;
  };
}

export type Resolvers<TRootContext extends ResolverContext = {}> = {
  [typeName: string]: TypeResolver<unknown, TRootContext>;
};

export interface CheckQuery<TRootContext extends ResolverContext = {}> {
  readonly user: unknown;
  readonly object: unknown;
  readonly relation: string;
  readonly context?: TRootContext;
}

export interface GraplixRuntime<TContext extends ResolverContext = {}> {
  check(query: CheckQuery<TContext>): Promise<boolean>;
}

interface RuntimeSchema {
  readonly types: ReadonlyMap<string, RuntimeTypeDefinition>;
}

interface RuntimeTypeDefinition {
  readonly relations: ReadonlyMap<string, RelationDefinition>;
}

interface RelationDefinition {
  readonly terms: readonly GraplixRelationTerm[];
  readonly directTargetTypes: ReadonlySet<string>;
}

interface InternalState<TContext extends ResolverContext> {
  readonly context: TContext;
  readonly schema: RuntimeSchema;
  readonly resolvers: Resolvers<TContext>;
  readonly relationValuesCache: Map<string, readonly EntityRef[]>;
  readonly entityCache: Map<string, unknown | null>;
  readonly visited: Set<string>;
}

export interface GraplixOptions<TContext extends ResolverContext = {}> {
  readonly schema: string;
  readonly resolvers: Resolvers<TContext>;
}

export function createEngine<TContext extends ResolverContext = {}>(
  options: GraplixOptions<TContext>,
): GraplixRuntime<TContext> {
  const compiledSchema = (async (): Promise<RuntimeSchema> => {
    const document = await parse(options.schema);
    const diagnostics = document.diagnostics ?? [];

    if (diagnostics.length > 0) {
      const messages = diagnostics.map((item) => item.message).join("\n");
      throw new Error(`Invalid Graplix schema:\n${messages}`);
    }

    return buildRuntimeSchema(document);
  })();

  const check = async (query: CheckQuery<TContext>): Promise<boolean> => {
    const schema = await compiledSchema;
    const context = (query.context ?? {}) as TContext;
    const state: InternalState<TContext> = {
      context,
      schema,
      resolvers: options.resolvers,
      relationValuesCache: new Map<string, readonly EntityRef[]>(),
      entityCache: new Map<string, unknown | null>(),
      visited: new Set<string>(),
    };

    const user = await toEntityRef(query.user, state);
    const object = await toEntityRef(query.object, state);

    return evaluateRelation(state, object, query.relation, user);
  };

  return { check };
}

function getStateKey(type: string, id: string, relation?: string): string {
  return relation === undefined ? `${type}:${id}` : `${type}:${id}:${relation}`;
}

function buildRuntimeSchema(
  document: LangiumDocument<GraplixDocument>,
): RuntimeSchema {
  const types = new Map<string, RuntimeTypeDefinition>();

  const root = document.parseResult?.value;
  if (root === undefined) {
    throw new Error("Invalid Graplix schema: missing parse root.");
  }

  for (const typeDeclaration of root.types) {
    const relations = new Map<string, RelationDefinition>();

    for (const relation of typeDeclaration.relations?.relations ?? []) {
      const directTargetTypes = new Set<string>();

      for (const term of relation.expression.terms) {
        if (isGraplixDirectTypes(term)) {
          for (const target of term.targets) {
            directTargetTypes.add(target);
          }
        }
      }

      relations.set(relation.name, {
        terms: relation.expression.terms,
        directTargetTypes,
      });
    }

    types.set(typeDeclaration.name, { relations });
  }

  return { types };
}

function isEntityRef(value: unknown): value is EntityRef {
  if (value === null || typeof value !== "object") {
    return false;
  }

  return (
    "type" in value &&
    "id" in value &&
    typeof (value as { type: unknown }).type === "string" &&
    typeof (value as { id: unknown }).id === "string"
  );
}

async function toEntityRef<TContext extends ResolverContext>(
  value: unknown,
  state: InternalState<TContext>,
): Promise<EntityRef> {
  if (isEntityRef(value)) {
    return value;
  }

  let lastError: Error | undefined;

  for (const [typeName, resolver] of Object.entries(state.resolvers)) {
    try {
      const id = resolver.id(value);
      const loaded = await resolver.load(id, state.context);

      if (loaded === null) {
        continue;
      }

      if (loaded === value) {
        return { type: typeName, id };
      }

      if (resolver.id(loaded) === id) {
        return { type: typeName, id };
      }
    } catch (error) {
      if (error instanceof Error) {
        lastError = error;
      }
    }
  }

  const contextMessage =
    lastError === undefined ? "" : ` Last resolver error: ${lastError.message}`;

  throw new Error(
    `Cannot infer entity type from value. Add { type, id } fields, or provide a matching resolver id/load pair.${contextMessage}`,
  );
}

async function evaluateRelation<TContext extends ResolverContext>(
  state: InternalState<TContext>,
  object: EntityRef,
  relationName: string,
  user: EntityRef,
): Promise<boolean> {
  const typeDefinition = state.schema.types.get(object.type);
  if (typeDefinition === undefined) {
    return false;
  }

  const relationDefinition = typeDefinition.relations.get(relationName);
  if (relationDefinition === undefined) {
    return false;
  }

  const visitKey = getStateKey(object.type, object.id, relationName);
  if (state.visited.has(visitKey)) {
    return false;
  }

  state.visited.add(visitKey);

  try {
    for (const term of relationDefinition.terms) {
      if (await evaluateRelationTerm(state, term, object, user, relationName)) {
        return true;
      }
    }

    return false;
  } finally {
    state.visited.delete(visitKey);
  }
}

async function evaluateRelationTerm<TContext extends ResolverContext>(
  state: InternalState<TContext>,
  term: GraplixRelationTerm,
  object: EntityRef,
  user: EntityRef,
  currentRelation: string,
): Promise<boolean> {
  if (isGraplixDirectTypes(term)) {
    const allowedTargets = state.schema.types
      .get(object.type)
      ?.relations.get(currentRelation)?.directTargetTypes;
    const relationValues = await getRelationValues(
      state,
      object,
      currentRelation,
      allowedTargets,
    );

    return relationValues.some((candidate) => entityMatches(candidate, user));
  }

  if (isGraplixRelationFrom(term)) {
    if (term.source === undefined) {
      return evaluateRelation(state, object, term.relation, user);
    }

    const sourceRelationValues = await getRelationValues(
      state,
      object,
      term.source,
      undefined,
    );

    for (const sourceRef of sourceRelationValues) {
      if (await evaluateRelation(state, sourceRef, term.relation, user)) {
        return true;
      }
    }

    return false;
  }

  return false;
}

function entityMatches(left: EntityRef, right: EntityRef): boolean {
  return left.type === right.type && left.id === right.id;
}

async function getRelationValues<TContext extends ResolverContext>(
  state: InternalState<TContext>,
  object: EntityRef,
  relation: string,
  allowedTargetTypes?: ReadonlySet<string>,
): Promise<readonly EntityRef[]> {
  const cacheKey = getStateKey(object.type, object.id, relation);
  const cached = state.relationValuesCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const resolver = state.resolvers[object.type];
  if (resolver === undefined || resolver.relations === undefined) {
    return [];
  }

  const relationResolver = resolver.relations[relation];
  if (relationResolver === undefined) {
    return [];
  }

  const loadedObject = await loadEntity(state, object);
  if (loadedObject === null) {
    return [];
  }

  const relationResult = await relationResolver(loadedObject, state.context);
  const normalizedValues = await toEntityRefList(
    state,
    relationResult,
    allowedTargetTypes,
  );

  state.relationValuesCache.set(cacheKey, normalizedValues);

  return normalizedValues;
}

async function toEntityRefList<TContext extends ResolverContext>(
  state: InternalState<TContext>,
  value: unknown,
  allowedTargetTypes?: ReadonlySet<string>,
): Promise<readonly EntityRef[]> {
  if (value === null || value === undefined) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];
  const resolved: EntityRef[] = [];

  for (const entry of values) {
    const ref = await toEntityRef(entry, state);

    if (allowedTargetTypes !== undefined && !allowedTargetTypes.has(ref.type)) {
      continue;
    }

    resolved.push(ref);
  }

  return resolved;
}

async function loadEntity<TContext extends ResolverContext>(
  state: InternalState<TContext>,
  object: EntityRef,
): Promise<unknown | null> {
  const cacheKey = getStateKey(object.type, object.id);
  if (state.entityCache.has(cacheKey)) {
    return state.entityCache.get(cacheKey) ?? null;
  }

  const resolver = state.resolvers[object.type];
  if (resolver === undefined) {
    return null;
  }

  const loaded = await resolver.load(object.id, state.context);
  state.entityCache.set(cacheKey, loaded);

  return loaded;
}
