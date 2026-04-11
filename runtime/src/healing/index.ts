export class Supervisor {
  constructor(private readonly maxRetries = 3) {}

  async run(name: string, task: () => Promise<void> | void): Promise<void> {
    let attempt = 0;
    while (attempt <= this.maxRetries) {
      try {
        await Promise.resolve(task());
        return;
      } catch (error) {
        attempt += 1;
        if (attempt > this.maxRetries) throw new Error(`Supervisor failed '${name}': ${String(error)}`);
      }
    }
  }
}

export interface HealthStatus {
  name: string;
  healthy: boolean;
  details?: Record<string, unknown>;
}

export function healthCheck(name: string, healthy: boolean, details?: Record<string, unknown>): HealthStatus {
  return { name, healthy, details };
}
