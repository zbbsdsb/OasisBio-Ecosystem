import type { OasisBio, Profile, User, AssistantMessage } from '../models';

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ErrorCode {
  UNAUTHORIZED: 'UNAUTHORIZED';
  FORBIDDEN: 'FORBIDDEN';
  NOT_FOUND: 'NOT_FOUND';
  VALIDATION_ERROR: 'VALIDATION_ERROR';
  INTERNAL_ERROR: 'INTERNAL_ERROR';
  DEPRECATED: 'DEPRECATED';
  PUBLISH_FAILED: 'PUBLISH_FAILED';
  RPC_ERROR: 'RPC_ERROR';
}

export interface ProfileResponse {
  user: User;
  profile: Profile;
}

export interface DashboardStats {
  oasisBios: number;
  abilities: number;
  worlds: number;
  models: number;
  references: number;
  dcosFiles: number;
  eras: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  slug: string;
  timestamp: Date;
  stats?: any;
}

export interface OasisBioListResponse {
  oasisBios: OasisBio[];
}

export interface PublicOasisBioResponse {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  identityMode: string;
  currentEra: string | null;
  coverImageUrl: string | null;
  _count: {
    abilities: number;
    worlds: number;
    dcosFiles: number;
  };
}

export interface PublishResponse {
  ok: boolean;
  slug: string;
  publishedAt: Date;
  visibility: string;
}

export interface ValidatePublishResponse {
  ok: boolean;
  errors: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AssistantSessionSummary {
  id: string;
  agent: 'deo' | 'dia';
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface AssistantSessionDetail {
  id: string;
  agent: 'deo' | 'dia';
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: AssistantMessage[];
}

export interface CreateSessionResponse {
  id: string;
  agent: 'deo' | 'dia';
  title: string | null;
  createdAt: Date;
}

export interface SessionListResponse {
  sessions: AssistantSessionSummary[];
}

export interface MessageListResponse {
  messages: AssistantMessage[];
}

export interface ChatResponse {
  sessionId: string;
  agent: 'deo' | 'dia';
  response: string;
  routing: {
    primary: 'deo' | 'dia';
    secondary?: 'deo' | 'dia';
    confidence: number;
    reason: string;
  };
}

export interface AssistantProfileResponse {
  deo: {
    systemPrompt: string;
    apiEndpoint: string | null;
    apiKey: string | null;
    model: string;
    enabled: boolean;
    configured: boolean;
  };
  dia: {
    systemPrompt: string;
    apiEndpoint: string | null;
    apiKey: string | null;
    model: string;
    enabled: boolean;
    configured: boolean;
  };
}

export interface AssistantPermissionResponse {
  level: 'read' | 'write' | 'admin';
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canManageAssistant: boolean;
    canManageUsers: boolean;
    canExportData: boolean;
  };
  labels: {
    [key: string]: string;
  };
  description: string;
}
