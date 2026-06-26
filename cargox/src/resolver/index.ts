export interface DependencyGraph {
  root: string;
  dependencies: Record<string, string>;
}

export function resolveDependencyGraph(root: string, dependencies: Record<string, string>): DependencyGraph {
  return { root, dependencies: { ...dependencies } };
}
