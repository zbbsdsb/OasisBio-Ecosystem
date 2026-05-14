export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

export class OasisBioError extends Error implements AppError {
  code?: string;
  statusCode?: number;
  details?: unknown;

  constructor(
    message: string,
    options: { code?: string; statusCode?: number; details?: unknown } = {}
  ) {
    super(message);
    this.name = 'OasisBioError';
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
  }
}

export function createError(
  message: string,
  code?: string,
  statusCode?: number
): OasisBioError {
  return new OasisBioError(message, { code, statusCode });
}

export function isOasisBioError(error: unknown): error is OasisBioError {
  return error instanceof OasisBioError;
}

export function formatError(error: unknown): string {
  if (isOasisBioError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

export function shouldRetry(error: unknown): boolean {
  if (isOasisBioError(error)) {
    return error.code === ERROR_CODES.NETWORK_ERROR || 
           error.code === ERROR_CODES.TIMEOUT;
  }
  return false;
}

export function createRetryHandler<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): () => Promise<T> {
  let retries = 0;

  const execute = async (): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (shouldRetry(error) && retries < maxRetries) {
        retries++;
        await new Promise((resolve) => setTimeout(resolve, delay * retries));
        return execute();
      }
      throw error;
    }
  };

  return execute;
}
