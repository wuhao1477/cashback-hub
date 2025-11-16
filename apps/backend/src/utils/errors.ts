export class PlatformRequestError extends Error {
  traceId: string;
  statusCode: number;
  payload?: unknown;

  constructor(message: string, traceId: string, statusCode = 500, payload?: unknown) {
    super(message);
    this.name = 'PlatformRequestError';
    this.traceId = traceId;
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

export function normalizeError(error: unknown, fallbackTraceId: string) {
  if (error instanceof PlatformRequestError) {
    return { message: error.message, traceId: error.traceId, statusCode: error.statusCode };
  }
  if (error instanceof Error) {
    return { message: error.message, traceId: fallbackTraceId, statusCode: 500 };
  }
  return { message: '未知错误', traceId: fallbackTraceId, statusCode: 500 };
}
