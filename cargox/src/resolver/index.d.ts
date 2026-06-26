export interface DependencyGraph {
    root: string;
    dependencies: Record<string, string>;
}
export declare function resolveDependencyGraph(root: string, dependencies: Record<string, string>): DependencyGraph;
