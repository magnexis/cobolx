const flags = new Map<string, boolean>();

export function setFeatureFlag(name: string, enabled: boolean): void {
  flags.set(name, enabled);
}

export function featureEnabled(name: string): boolean {
  return flags.get(name) ?? false;
}
