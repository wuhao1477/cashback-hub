export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
  timestamp: string;
}

export function success<T>(data: T, traceId: string, message = 'OK'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    traceId,
    timestamp: new Date().toISOString(),
  };
}

export function failure(message: string, traceId: string, code = 500) {
  return {
    code,
    message,
    data: null,
    traceId,
    timestamp: new Date().toISOString(),
  };
}
