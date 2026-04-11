export class ArcBox<T> {
  private refs = 1;

  constructor(private value: T) {}

  clone(): ArcBox<T> {
    this.refs += 1;
    return this;
  }

  strongCount(): number {
    return this.refs;
  }

  release(): void {
    this.refs = Math.max(0, this.refs - 1);
  }

  get(): T {
    return this.value;
  }
}
