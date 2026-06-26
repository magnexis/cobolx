import { performance } from "node:perf_hooks";

export async function profile<T>(label: string, action: () => Promise<T> | T): Promise<{ label: string; durationMs: number; result: T }> {
  const start = performance.now();
  const result = await Promise.resolve(action());
  return {
    label,
    durationMs: performance.now() - start,
    result
  };
}
