import { generateJavaScript } from "../codegen/javascript.js";
function instructionCount(program) {
    return program.body.length + program.functions.reduce((total, fn) => total + fn.instructions.length, 0);
}
export function emitCustomBackend(program, mir, outputFilePath, stdlibDir) {
    return {
        target: "js-custom-backend",
        code: generateJavaScript(program, outputFilePath, stdlibDir),
        instructionCount: instructionCount(mir)
    };
}
//# sourceMappingURL=custom.js.map