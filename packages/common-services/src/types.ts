export interface SyncResult {
  userId: string;
  profileId: string;
  username: string;
  isNewUser: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface AuthErrorOptions {
  code?: string;
}

export class AuthError extends Error {
  public readonly code: string;

  constructor(
    message: string,
    public readonly statusCode: number,
    options?: AuthErrorOptions
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = options?.code ?? (
      statusCode === 401 ? 'UNAUTHORIZED' : 
      statusCode === 403 ? 'FORBIDDEN' : 
      statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'
    );
  }
}
