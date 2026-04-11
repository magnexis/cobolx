type EventHandler<T = unknown> = (payload: T) => Promise<void> | void;

export class EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  on<T>(eventName: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventName) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventName, existing);
  }

  async emit<T>(eventName: string, payload: T): Promise<void> {
    for (const handler of this.handlers.get(eventName) ?? []) {
      await handler(payload);
    }
  }
}

export function createEventBus(): EventBus {
  return new EventBus();
}
