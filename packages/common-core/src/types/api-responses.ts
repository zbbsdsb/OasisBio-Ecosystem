import type { OasisBio, Profile, User } from '../models';

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
