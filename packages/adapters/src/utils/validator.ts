export function isRecord<T extends Record<string, unknown> = Record<string, unknown>>(value: unknown): value is T {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function parseJson<T>(value: unknown): T | null {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  const result: T[] = [];
  items.forEach((item) => {
    const id = key(item);
    if (seen.has(id)) return;
    seen.add(id);
    result.push(item);
  });
  return result;
}
