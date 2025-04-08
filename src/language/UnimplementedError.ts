enum ErrorCode {
  UNIMPLEMENTED = "UNIMPLEMENTED",
}

export class UnimplementedError extends Error {
  code: ErrorCode = ErrorCode.UNIMPLEMENTED;

  constructor(featureName: string) {
    super(`${featureName} is not implemented`);
  }
}
