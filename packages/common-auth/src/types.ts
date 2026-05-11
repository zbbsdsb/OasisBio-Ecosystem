import type { User, Profile } from '@oasisbio/common-core';

export interface AuthSession {
  user: User;
  profile: Profile;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  error: Error | null;
}

export interface OtpErrorResponse {
  code: string;
  message: string;
}

export interface AuthCredentials {
  email: string;
  token?: string;
}
