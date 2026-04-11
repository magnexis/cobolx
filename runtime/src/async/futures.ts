export interface CobolxFuture<T> {
  await(): Promise<T>;
}

export function futureOf<T>(factory: () => Promise<T> | T): CobolxFuture<T> {
  return {
    async await() {
      return await Promise.resolve(factory());
    }
  };
}
