import { display, input, math, strings, Result, Option, iter, spawn, channel } from "../stdlib/core/runtime.js";


function __variant(tag, values) { return { tag, values }; }
function __propagate(value) { if (value && value.tag === "ERR") throw new Error(String(value.values?.[0] ?? "propagated error")); return value?.tag === "OK" ? value.values[0] : value; }

const LIMIT = 3;
const OK = (...values) => __variant("OK", values);
const ERR = (...values) => __variant("ERR", values);
function __macro_say(value) {
  display(value);
}
function inspect(item) {
  {
    const __matchValue = item;
    if (__matchValue?.tag === "OK") {
      const value = __matchValue.values[0];
      __macro_say("matched ok");
      display(value);
    }
    else if (__matchValue?.tag === "ERR") {
      const problem = __matchValue.values[0];
      display(problem);
    }
  }
  return __propagate(item);
}

function main() {
  const result = __variant("OK", [LIMIT]);
  inspect(result);
}

main();

