export type Task<T = unknown> = () => Promise<T> | T;

export class TaskScheduler {
  async run<T>(task: Task<T>): Promise<T> {
    return await Promise.resolve(task());
  }

  async all<T>(tasks: Array<Task<T>>): Promise<T[]> {
    return await Promise.all(tasks.map((task) => this.run(task)));
  }
}
