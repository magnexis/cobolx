import { display, input, math, strings } from "../stdlib/core/runtime.js";

function add(left, right) {
  return (left + right);
}

function main() {
  let total = add(4, 5);
  display(total);
}

main();
