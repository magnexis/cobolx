type Handler = (message: unknown) => void | Promise<void>;

export class Actor {
  private readonly mailbox: unknown[] = [];
  private busy = false;

  constructor(public readonly name: string, private readonly handler: Handler) {}

  send(message: unknown): void {
    this.mailbox.push(message);
    void this.drain();
  }

  private async drain(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    while (this.mailbox.length > 0) {
      const message = this.mailbox.shift();
      await this.handler(message);
    }
    this.busy = false;
  }
}

export function createActor(name: string, handler: Handler): Actor {
  return new Actor(name, handler);
}
