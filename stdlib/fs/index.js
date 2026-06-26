import fs from "node:fs";

export function readText(path) {
  return fs.readFileSync(path, "utf8");
}

export function writeText(path, contents) {
  fs.writeFileSync(path, contents, "utf8");
}
