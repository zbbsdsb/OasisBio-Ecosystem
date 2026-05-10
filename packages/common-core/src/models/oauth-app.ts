import type { User, OauthAuthorizationCode, OauthToken } from './';

export interface OauthApp {
  id: string;
  ownerUserId: string;
  name: string;
  description: string | null;
  homepageUrl: string;
  logoUrl: string | null;
  redirectUris: string[];
  clientId: string;
  clientSecretHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  owner?: User;
  authCodes?: OauthAuthorizationCode[];
  tokens?: OauthToken[];
}
