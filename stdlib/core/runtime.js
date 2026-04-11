import fs from "node:fs";

export function display(value) {
  console.log(value);
}

export function input(promptText = "") {
  if (promptText) {
    process.stdout.write(String(promptText));
  }
  const buffer = fs.readFileSync(0, "utf8");
  return buffer.toString().trimEnd();
}

export const math = {
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  max: Math.max,
  min: Math.min,
  sqrt: Math.sqrt,
  pow: Math.pow
};

export const strings = {
  length(value) {
    return String(value).length;
  },
  upper(value) {
    return String(value).toUpperCase();
  },
  lower(value) {
    return String(value).toLowerCase();
  },
  concat(...values) {
    return values.map((value) => String(value)).join("");
  }
};

export const Result = {
  ok(value) {
    return { tag: "OK", values: [value] };
  },
  err(error) {
    return { tag: "ERR", values: [error] };
  }
};

export const Option = {
  some(value) {
    return { tag: "SOME", values: [value] };
  },
  none() {
    return { tag: "NONE", values: [] };
  }
};

export function iter(items) {
  return {
    items: [...items],
    map(fn) {
      return iter(this.items.map(fn));
    },
    filter(fn) {
      return iter(this.items.filter(fn));
    },
    reduce(fn, initial) {
      return this.items.reduce(fn, initial);
    },
    collect() {
      return [...this.items];
    }
  };
}

export function spawn(task) {
  return Promise.resolve().then(() => task());
}

export function channel() {
  const queue = [];
  return {
    send(value) {
      queue.push(value);
    },
    receive() {
      return queue.shift();
    }
  };
}

export function createDebuggerContext(traceFile = process.env.COBOLX_DEBUG_TRACE_FILE) {
  const timeline = [];
  const state = {};
  return {
    set(name, value) {
      state[name] = value;
      this.record(`set:${name}`);
    },
    record(action) {
      timeline.push({
        step: timeline.length,
        action,
        state: structuredClone(state),
        at: new Date().toISOString()
      });
      if (traceFile) {
        fs.writeFileSync(traceFile, JSON.stringify(timeline, null, 2), "utf8");
      }
    },
    timeline() {
      return [...timeline];
    }
  };
}

export function createEventBus() {
  const handlers = new Map();
  return {
    on(name, handler) {
      handlers.set(name, [...(handlers.get(name) ?? []), handler]);
    },
    async emit(name, payload) {
      for (const handler of handlers.get(name) ?? []) {
        await handler(payload);
      }
    }
  };
}

export function createWorkflow(steps) {
  return {
    async run() {
      for (const step of steps) {
        let attempts = 0;
        const retries = step.retries ?? 0;
        while (true) {
          attempts += 1;
          try {
            await Promise.resolve(step.run({ attempts }));
            break;
          } catch (error) {
            if (attempts > retries + 1) throw error;
          }
        }
      }
    }
  };
}

export function createVersionedState(initial) {
  const history = [];
  let version = 0;
  const push = (value) => {
    history.push({ version, value: structuredClone(value), at: new Date().toISOString() });
    version += 1;
  };
  push(initial);
  return {
    set(value) {
      push(value);
    },
    current() {
      return history[history.length - 1];
    },
    rollback(targetVersion) {
      return history.find((item) => item.version === targetVersion);
    },
    timeline() {
      return [...history];
    }
  };
}

export function createSupervisor(maxRetries = 3) {
  return {
    async run(name, task) {
      let attempt = 0;
      while (attempt <= maxRetries) {
        try {
          await Promise.resolve(task());
          return;
        } catch (error) {
          attempt += 1;
          if (attempt > maxRetries) throw new Error(`Supervisor failed ${name}: ${String(error)}`);
        }
      }
    }
  };
}
