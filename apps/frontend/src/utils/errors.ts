export class PlatformRequestError extends Error {
  traceId: string;
  original?: unknown;

  constructor(message: string, traceId: string, original?: unknown) {
    super(message);
    this.name = 'PlatformRequestError';
    this.traceId = traceId;
    this.original = original;
  }
}

export function toDisplayMessage(error: unknown) {
  if (error instanceof PlatformRequestError) {
    return {
      message: error.message,
      traceId: error.traceId,
    };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: '未知错误' };
}
