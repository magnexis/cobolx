import { performance } from "node:perf_hooks";
export async function profile(label, action) {
    const start = performance.now();
    const result = await Promise.resolve(action());
    return {
        label,
        durationMs: performance.now() - start,
        result
    };
}
//# sourceMappingURL=index.js.map