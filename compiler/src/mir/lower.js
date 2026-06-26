export function lowerToMIR(hir) {
    return {
        functions: hir.functions.map((fn) => ({
            name: fn.name,
            instructions: fn.body.map(({ statement }) => ({ op: "statement", statement }))
        })),
        body: hir.body.map(({ statement }) => ({ op: "statement", statement }))
    };
}
//# sourceMappingURL=lower.js.map