const ENTITY_REF_BRAND: unique symbol = Symbol("EntityRef");

export class EntityRef {
  // Type-level brand via unique symbol. 'declare' fields are erased at runtime,
  // so there is no extra property on instances — only type-system uniqueness.
  private declare readonly [ENTITY_REF_BRAND]: true;

  readonly type: string;
  readonly id: string;

  constructor(type: string, id: string) {
    this.type = type;
    this.id = id;
  }
}
