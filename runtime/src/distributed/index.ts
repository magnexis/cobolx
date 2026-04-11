const registry = new Map<string, string>();

export function registerService(name: string, address: string): void {
  registry.set(name, address);
}

export function discoverService(name: string): string | undefined {
  return registry.get(name);
}

export function listServices(): Record<string, string> {
  return Object.fromEntries(registry.entries());
}
