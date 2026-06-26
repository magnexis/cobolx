const secrets = new Map<string, string>();

export function setSecret(name: string, value: string): void {
  secrets.set(name, value);
}

export function getSecret(name: string): string {
  const value = secrets.get(name) ?? process.env[name];
  if (!value) {
    throw new Error(`Secret '${name}' not found`);
  }
  return value;
}
