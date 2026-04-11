export declare function profile<T>(label: string, action: () => Promise<T> | T): Promise<{
    label: string;
    durationMs: number;
    result: T;
}>;
