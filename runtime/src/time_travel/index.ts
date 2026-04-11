import fs from "node:fs";

export interface TimelineEntry {
  step: number;
  action: string;
  state: Record<string, unknown>;
  at: string;
}

export class TimeTravelDebugger {
  private readonly timeline: TimelineEntry[] = [];
  private state: Record<string, unknown> = {};
  private step = 0;

  constructor(private readonly traceFile?: string) {}

  set(name: string, value: unknown): void {
    this.state = { ...this.state, [name]: value };
    this.record(`set:${name}`);
  }

  record(action: string): void {
    this.timeline.push({
      step: this.step,
      action,
      state: structuredClone(this.state),
      at: new Date().toISOString()
    });
    this.step += 1;
    this.flush();
  }

  snapshot(): TimelineEntry[] {
    return [...this.timeline];
  }

  rewind(step: number): TimelineEntry | undefined {
    return this.timeline.find((entry) => entry.step === step);
  }

  latest(): TimelineEntry | undefined {
    return this.timeline.at(-1);
  }

  private flush(): void {
    if (!this.traceFile) return;
    fs.writeFileSync(this.traceFile, JSON.stringify(this.timeline, null, 2), "utf8");
  }
}

export function loadTimeline(traceFile: string): TimelineEntry[] {
  if (!fs.existsSync(traceFile)) return [];
  return JSON.parse(fs.readFileSync(traceFile, "utf8")) as TimelineEntry[];
}
