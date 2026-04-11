import readline from "node:readline";
import { analyzeSource, compileSource, compilerStdlibDir } from "@cobolx/compiler";

export async function runReplCommand(): Promise<number> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "cobolx> " });
  console.log("COBOL-X REPL. Enter DISPLAY expressions or PROGRAM blocks. Type .exit to quit.");
  rl.prompt();

  return await new Promise<number>((resolve) => {
    rl.on("line", (line) => {
      if (line.trim() === ".exit") {
        rl.close();
        return;
      }
      const source = line.trim().startsWith("PROGRAM") ? line : `PROGRAM Repl\n\nBEGIN\n${line}\nEND\n`;
      try {
        const result = compileSource(source, "repl.mjs", compilerStdlibDir());
        if (result.diagnostics.length > 0) {
          console.log(result.diagnostics.map((d) => d.message).join("\n"));
        } else {
          console.log("ok");
        }
      } catch (error) {
        console.error(String(error));
      }
      rl.prompt();
    });
    rl.on("close", () => resolve(0));
  });
}
