import { parseSource } from "@cobolx/compiler";

export function inspectProgram(source: string) {
  return parseSource(source);
}
