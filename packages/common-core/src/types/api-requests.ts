export interface CreateOasisBioRequest {
  title: string;
  tagline?: string;
  identityMode?: string;
  birthDate?: Date;
  gender?: string;
  pronouns?: string;
  placeOfOrigin?: string;
  currentEra?: string;
  species?: string;
  status?: string;
  description?: string;
}

export interface UpdateOasisBioRequest {
  title?: string;
  tagline?: string;
  summary?: string;
  identityMode?: string;
  birthDate?: Date;
  gender?: string;
  pronouns?: string;
  placeOfOrigin?: string;
  currentEra?: string;
  species?: string;
  status?: string;
  description?: string;
  visibility?: string;
}

export interface CreateAbilityRequest {
  name: string;
  category: string;
  sourceType?: string;
  level?: number;
  description?: string;
  relatedWorldId?: string;
  relatedEraId?: string;
}

export interface UpdateAbilityRequest {
  name?: string;
  category?: string;
  sourceType?: string;
  level?: number;
  description?: string;
  relatedWorldId?: string;
  relatedEraId?: string;
}

export interface CreateDcosRequest {
  title: string;
  content: string;
  slug?: string;
  folderPath?: string;
  status?: string;
  eraId?: string;
}

export interface UpdateDcosRequest {
  name?: string;
  content?: string;
  type?: string;
}

export interface CreateReferenceRequest {
  url: string;
  title: string;
  description?: string;
  sourceType?: string;
  provider?: string;
  coverImage?: string;
  metadata?: string;
  eraId?: string;
  worldId?: string;
  tags?: string;
}

export interface UpdateReferenceRequest {
  url?: string;
  title?: string;
  description?: string;
  sourceType?: string;
  provider?: string;
  coverImage?: string;
  metadata?: string;
  eraId?: string;
  worldId?: string;
  tags?: string;
}

export interface CreateEraRequest {
  name: string;
  eraType: string;
  description?: string;
  startYear?: number;
  endYear?: number;
}

export interface UpdateEraRequest {
  name?: string;
  eraType?: string;
  description?: string;
  startYear?: number;
  endYear?: number;
}

export interface CreateWorldRequest {
  name: string;
  summary: string;
  timeSetting?: string;
  geography?: string;
  physicsRules?: string;
  socialStructure?: string;
  aestheticKeywords?: string;
  majorConflict?: string;
  timeline?: string;
  rules?: string;
  factions?: string;
  genre?: string;
  tone?: string;
}

export interface UpdateWorldRequest {
  name?: string;
  summary?: string;
  timeSetting?: string;
  geography?: string;
  physicsRules?: string;
  socialStructure?: string;
  aestheticKeywords?: string;
  majorConflict?: string;
  timeline?: string;
  rules?: string;
  factions?: string;
  genre?: string;
  tone?: string;
}

export interface CreateWorldDocumentRequest {
  title: string;
  content: string;
  docType: string;
  slug?: string;
  folderPath?: string;
  sortOrder?: number;
}

export interface UpdateWorldDocumentRequest {
  title?: string;
  content?: string;
  docType?: string;
  slug?: string;
  folderPath?: string;
  sortOrder?: number;
}

export interface UpdateProfileRequest {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  locale?: string;
  defaultLanguage?: string;
}

export interface UpdateSettingsRequest {
  section: 'account' | 'profile' | 'security';
  data: any;
}

export interface PublishBioRequest {
  visibility?: string;
  requestId?: string;
}

export interface LoginWithOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  token: string;
  type: 'email' | 'sms';
}

export interface RegisterRequest {
  email: string;
  username: string;
  displayName: string;
}

export interface CreateAssistantSessionRequest {
  agent?: 'deo' | 'dia';
  title?: string;
}

export interface UpdateAssistantSessionRequest {
  title?: string;
}

export interface SendChatMessageRequest {
  sessionId?: string;
  agent?: 'deo' | 'dia';
  message: string;
  context?: {
    currentBioId?: string;
    currentWorldId?: string;
  };
}

export interface UpdateAssistantProfileRequest {
  agent: 'deo' | 'dia';
  systemPrompt?: string;
  apiEndpoint?: string | null;
  apiKey?: string | null;
  model?: string;
  enabled?: boolean;
}

export interface UpdateAssistantPermissionRequest {
  level?: 'read' | 'write' | 'admin';
  permissions?: {
    canRead?: boolean;
    canWrite?: boolean;
    canDelete?: boolean;
    canManageAssistant?: boolean;
    canManageUsers?: boolean;
    canExportData?: boolean;
  };
}
