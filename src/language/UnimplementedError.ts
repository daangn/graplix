enum ErrorCode {
  UNIMPLEMENTED = "UNIMPLEMENTED",
}

export class UnimplementedError extends Error {
  code = ErrorCode.UNIMPLEMENTED;

  constructor(featureName: string) {
    super(`${featureName} is not implemented`);
  }
}
