import path from "node:path";
import { createRequire } from "node:module";
import type { Diagnostic } from "../diagnostics.js";
import type { ProgramNode } from "../ast/types.js";
import type { CompilerPlugin } from "./api.js";

export function applyCompilerPlugins(program: ProgramNode, baseDir: string): { program: ProgramNode; diagnostics: Diagnostic[] } {
  let current = program;
  const diagnostics: Diagnostic[] = [];
  const require = createRequire(import.meta.url);

  for (const pluginRef of program.plugins) {
    const pluginPath = path.isAbsolute(pluginRef.pluginPath) ? pluginRef.pluginPath : path.resolve(baseDir, pluginRef.pluginPath);
    const module = require(pluginPath);
    const plugin = (module.default ?? module.plugin) as CompilerPlugin;
    if (plugin.transformProgram) current = plugin.transformProgram(current) as ProgramNode;
    if (plugin.lintProgram) diagnostics.push(...(plugin.lintProgram(current) as Diagnostic[]));
  }

  return { program: current, diagnostics };
}
