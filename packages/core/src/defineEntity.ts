export function defineEntity<
  T extends string,
  F extends (...args: any[]) => object,
>(type: T, define: F): (...args: Parameters<F>) => { type: T } & ReturnType<F> {
  return (...args) => {
    const definition = define(...args) as ReturnType<F>;

    return { type, ...definition };
  };
}
