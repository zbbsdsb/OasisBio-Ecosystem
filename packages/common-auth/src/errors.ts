export class AuthError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(
    message: string,
    code: string = 'UNAUTHORIZED',
    statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class OtpError extends Error {
  public readonly code: string;

  constructor(
    message: string,
    code: string = 'OTP_INVALID'
  ) {
    super(message);
    this.name = 'OtpError';
    this.code = code;
  }
}
