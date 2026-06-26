import { inferProgramTypes } from "../type_system/checker.js";
function collectMutatedParams(params, statements) {
    const mutated = new Set();
    for (const statement of statements) {
        switch (statement.kind) {
            case "SetStatement":
            case "InputStatement":
                if (params.includes(statement.name)) {
                    mutated.add(statement.name);
                }
                break;
            case "IfStatement":
                for (const name of collectMutatedParams(params, statement.thenBranch)) {
                    mutated.add(name);
                }
                for (const name of collectMutatedParams(params, statement.elseBranch)) {
                    mutated.add(name);
                }
                break;
        }
    }
    return [...mutated];
}
function lowerFunction(program) {
    return program.functions.map((fn) => ({
        name: fn.name,
        params: [...fn.params],
        mutatedParams: collectMutatedParams(fn.params, fn.body),
        body: fn.body.map((statement) => ({ statement }))
    }));
}
export function lowerToHIR(program) {
    const typeInfo = inferProgramTypes(program);
    return {
        diagnostics: typeInfo.diagnostics,
        hir: {
            program,
            functions: lowerFunction(program),
            body: program.body.map((statement) => ({ statement })),
            symbolTypes: typeInfo.symbolTypes
        }
    };
}
//# sourceMappingURL=lower.js.map