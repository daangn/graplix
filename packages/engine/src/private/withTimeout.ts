export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  // The Promise executor runs synchronously, so timeoutId is always assigned
  // before the .finally() callback can fire. The non-null assertion reflects this.
  let timeoutId!: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Resolver timed out after ${ms}ms: ${label}`));
    }, ms);
  });

  // Attach a no-op handler so that if `promise` rejects after the timeout
  // wins the race, Node.js does not treat it as an unhandled rejection.
  promise.catch(() => {});

  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ]);
}
