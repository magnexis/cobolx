export interface ReplContext {
  values: Record<string, unknown>;
}

export function createReplContext(): ReplContext {
  return { values: {} };
}
