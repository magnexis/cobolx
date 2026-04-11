export class CobolxIterator<T> {
  constructor(private readonly items: T[]) {}

  map<U>(fn: (value: T) => U): CobolxIterator<U> {
    return new CobolxIterator(this.items.map(fn));
  }

  filter(fn: (value: T) => boolean): CobolxIterator<T> {
    return new CobolxIterator(this.items.filter(fn));
  }

  reduce<U>(fn: (acc: U, value: T) => U, initial: U): U {
    return this.items.reduce(fn, initial);
  }

  collect(): T[] {
    return [...this.items];
  }
}

export function iter<T>(items: T[]): CobolxIterator<T> {
  return new CobolxIterator(items);
}
