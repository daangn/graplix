import { UnimplementedError } from "../language/UnimplementedError";

export class ExceptionCollector {
  constructor(private errors: UnimplementedError[]) {}

  captureUnimplementedError(featureName: string): void {
    this.errors.push(new UnimplementedError(featureName));
  }
}
