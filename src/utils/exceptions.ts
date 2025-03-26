import { UnimplementedSingleError } from "../dsl/errors";

export class ExceptionCollector {
  constructor(private errors: UnimplementedSingleError[]) {}

  captureUnimplementedError(featureName: string) {
    this.errors.push(new UnimplementedSingleError(featureName));
  }
}
