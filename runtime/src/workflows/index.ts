export interface WorkflowStepContext {
  attempts: number;
}

export interface WorkflowStep {
  name: string;
  timeoutMs?: number;
  retries?: number;
  run: (context: WorkflowStepContext) => Promise<void> | void;
}

export class WorkflowEngine {
  constructor(private readonly steps: WorkflowStep[]) {}

  async execute(): Promise<void> {
    for (const step of this.steps) {
      let attempts = 0;
      const retries = step.retries ?? 0;
      while (true) {
        attempts += 1;
        try {
          await Promise.race([
            Promise.resolve(step.run({ attempts })),
            new Promise((_, reject) =>
              step.timeoutMs ? setTimeout(() => reject(new Error(`Workflow step '${step.name}' timed out`)), step.timeoutMs) : undefined
            )
          ]);
          break;
        } catch (error) {
          if (attempts > retries + 1) throw error;
        }
      }
    }
  }
}
