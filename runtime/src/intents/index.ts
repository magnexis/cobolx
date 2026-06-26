export interface ExecutionIntent {
  optimizeFor?: "speed" | "memory" | "throughput";
}

export function normalizeIntent(intent?: ExecutionIntent): Required<ExecutionIntent> {
  return {
    optimizeFor: intent?.optimizeFor ?? "speed"
  };
}
