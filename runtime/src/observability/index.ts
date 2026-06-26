const metrics = new Map<string, number>();
const traces: Array<{ name: string; at: string; details?: Record<string, unknown> }> = [];

export function log(level: "INFO" | "WARN" | "ERROR", message: string, details?: Record<string, unknown>): void {
  const payload = { level, message, details, at: new Date().toISOString() };
  console.log(JSON.stringify(payload));
}

export function incrementMetric(name: string, value = 1): void {
  metrics.set(name, (metrics.get(name) ?? 0) + value);
}

export function getMetrics(): Record<string, number> {
  return Object.fromEntries(metrics.entries());
}

export function trace(name: string, details?: Record<string, unknown>): void {
  traces.push({ name, details, at: new Date().toISOString() });
}

export function getTraces(): Array<{ name: string; at: string; details?: Record<string, unknown> }> {
  return [...traces];
}
