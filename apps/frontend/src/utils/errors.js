export class PlatformRequestError extends Error {
    constructor(message, traceId, original) {
        super(message);
        Object.defineProperty(this, "traceId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "original", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = 'PlatformRequestError';
        this.traceId = traceId;
        this.original = original;
    }
}
export function toDisplayMessage(error) {
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
