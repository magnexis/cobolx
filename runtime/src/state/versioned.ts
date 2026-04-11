export interface VersionedSnapshot<T> {
  version: number;
  value: T;
  at: string;
}

export class VersionedState<T> {
  private version = 0;
  private history: VersionedSnapshot<T>[] = [];

  constructor(initial: T) {
    this.set(initial);
  }

  set(value: T): void {
    this.history.push({ version: this.version, value: structuredClone(value), at: new Date().toISOString() });
    this.version += 1;
  }

  current(): VersionedSnapshot<T> {
    return this.history[this.history.length - 1];
  }

  rollback(version: number): VersionedSnapshot<T> | undefined {
    return this.history.find((item) => item.version === version);
  }

  timeline(): VersionedSnapshot<T>[] {
    return [...this.history];
  }
}
