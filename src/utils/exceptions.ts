import { UnimplementedSingleError } from "../language";

export class ExceptionCollector {
  constructor(private errors: UnimplementedSingleError[]) {}

  captureUnimplementedError(featureName: string) {
    this.errors.push(new UnimplementedSingleError(featureName));
  }
}
