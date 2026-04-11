export interface ConfigDefinition<T> {
  key: string;
  defaultValue?: T;
  env?: string;
  parser?: (value: string) => T;
}

export function readConfig<T>(definition: ConfigDefinition<T>): T {
  const envValue = definition.env ? process.env[definition.env] : undefined;
  if (envValue !== undefined) {
    return definition.parser ? definition.parser(envValue) : (envValue as T);
  }
  if (definition.defaultValue !== undefined) {
    return definition.defaultValue;
  }
  throw new Error(`Missing configuration value for ${definition.key}`);
}
