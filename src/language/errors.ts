export abstract class SingleError extends Error {
  constructor(public message: string) {
    super(message);
  }

  toString() {
    return this.message;
  }
}

export class UnimplementedSingleError extends SingleError {
  constructor(featureName: string) {
    super(`${featureName} is not implemented`);
    this.name = "UnimplementedError";
  }
}

abstract class MultipleError<T = SingleError> extends Error {
  constructor(public errors: Array<T>) {
    super(
      `${errors.length} error${errors.length > 1 ? "s" : ""} occurred:\n\t* ${errors.join("\n\t* ")}\n\n`,
    );
    this.errors = errors;
  }

  toString() {
    return this.message;
  }
}

export class UnimplementedError extends MultipleError<UnimplementedSingleError> {}
