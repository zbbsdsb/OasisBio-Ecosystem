import type { OauthApp } from './';

export interface OauthAuthorizationCode {
  id: string;
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  usedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  
  app?: OauthApp;
}
