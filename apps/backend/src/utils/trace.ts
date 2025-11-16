import crypto from 'node:crypto';

export function createTraceId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
