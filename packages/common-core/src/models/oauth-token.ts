import type { OauthApp } from './';

export interface OauthToken {
  id: string;
  clientId: string;
  userId: string;
  scope: string;
  jti: string;
  refreshTokenHash: string;
  revokedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  
  app?: OauthApp;
}
