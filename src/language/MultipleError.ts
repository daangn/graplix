import type { UnimplementedError } from "./UnimplementedError";

export class MultipleError<T extends Error> extends Error {
  constructor(public errors: Array<T>) {
    super(
      `${errors.length} error${errors.length > 1 ? "s" : ""} occurred:\n\t* ${errors.join("\n\t* ")}\n\n`,
    );
  }
}

export class MultipleUnimplementedError extends MultipleError<UnimplementedError> {}
