import crypto from 'node:crypto';

export type PlainParams = Record<string, string | number | boolean | undefined | null>;

export function buildSignedParams(params: PlainParams, secret: string) {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    normalized[key] = String(value);
  }
  const signature = createSignature(normalized, secret);
  return { ...normalized, sign: signature };
}

function createSignature(payload: Record<string, string>, secret: string) {
  const sorted = Object.keys(payload)
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join('&');
  return crypto.createHmac('sha256', secret).update(sorted).digest('hex');
}
