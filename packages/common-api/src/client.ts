import type {
  ApiResponse,
  ApiError,
  CreateOasisBioRequest,
  UpdateOasisBioRequest,
  CreateAbilityRequest,
  UpdateAbilityRequest,
  CreateDcosRequest,
  UpdateDcosRequest,
  CreateReferenceRequest,
  UpdateReferenceRequest,
  CreateEraRequest,
  UpdateEraRequest,
  CreateWorldRequest,
  UpdateWorldRequest,
  CreateWorldDocumentRequest,
  UpdateWorldDocumentRequest,
  UpdateProfileRequest,
  UpdateSettingsRequest,
  PublishBioRequest,
  LoginWithOtpRequest,
  VerifyOtpRequest,
  RegisterRequest
} from '@oasisbio/common-core';
import type {
  User,
  Profile,
  OasisBio,
  Ability,
  DcosFile,
  ReferenceItem,
  EraIdentity,
  WorldItem,
  WorldDocument,
  ModelItem
} from '@oasisbio/common-core';

export interface OasisBioApiClient {
  auth: {
    loginWithOtp(request: LoginWithOtpRequest): Promise<ApiResponse<void>>;
    verifyOtp(request: VerifyOtpRequest): Promise<ApiResponse<{ session: any }>>;
    register(request: RegisterRequest): Promise<ApiResponse<void>>;
    logout(): Promise<void>;
  };

  profile: {
    getProfile(): Promise<ApiResponse<{ user: User; profile: Profile }>>;
    updateProfile(request: UpdateProfileRequest): Promise<ApiResponse<Profile>>;
  };

  oasisBios: {
    list(): Promise<ApiResponse<OasisBio[]>>;
    create(request: CreateOasisBioRequest): Promise<ApiResponse<OasisBio>>;
    getById(id: string): Promise<ApiResponse<OasisBio>>;
    update(id: string, request: UpdateOasisBioRequest): Promise<ApiResponse<OasisBio>>;
    delete(id: string): Promise<ApiResponse<void>>;
    publish(id: string, request: PublishBioRequest): Promise<ApiResponse<any>>;
  };

  abilities: {
    listByOasisBioId(oasisBioId: string): Promise<ApiResponse<Ability[]>>;
    create(oasisBioId: string, request: CreateAbilityRequest): Promise<ApiResponse<Ability>>;
    update(id: string, request: UpdateAbilityRequest): Promise<ApiResponse<Ability>>;
    delete(id: string): Promise<ApiResponse<void>>;
  };

  dcosFiles: {
    listByOasisBioId(oasisBioId: string): Promise<ApiResponse<DcosFile[]>>;
    create(oasisBioId: string, request: CreateDcosRequest): Promise<ApiResponse<DcosFile>>;
    update(id: string, request: UpdateDcosRequest): Promise<ApiResponse<DcosFile>>;
    delete(id: string): Promise<ApiResponse<void>>;
  };

  references: {
    listByOasisBioId(oasisBioId: string): Promise<ApiResponse<ReferenceItem[]>>;
    create(oasisBioId: string, request: CreateReferenceRequest): Promise<ApiResponse<ReferenceItem>>;
    update(id: string, request: UpdateReferenceRequest): Promise<ApiResponse<ReferenceItem>>;
    delete(id: string): Promise<ApiResponse<void>>;
  };

  eras: {
    listByOasisBioId(oasisBioId: string): Promise<ApiResponse<EraIdentity[]>>;
    create(oasisBioId: string, request: CreateEraRequest): Promise<ApiResponse<EraIdentity>>;
    update(id: string, request: UpdateEraRequest): Promise<ApiResponse<EraIdentity>>;
    delete(id: string): Promise<ApiResponse<void>>;
  };

  worlds: {
    listByOasisBioId(oasisBioId: string): Promise<ApiResponse<WorldItem[]>>;
    create(oasisBioId: string, request: CreateWorldRequest): Promise<ApiResponse<WorldItem>>;
    getById(id: string): Promise<ApiResponse<WorldItem>>;
    update(id: string, request: UpdateWorldRequest): Promise<ApiResponse<WorldItem>>;
    delete(id: string): Promise<ApiResponse<void>>;
    listDocuments(worldId: string): Promise<ApiResponse<WorldDocument[]>>;
    createDocument(worldId: string, request: CreateWorldDocumentRequest): Promise<ApiResponse<WorldDocument>>;
    updateDocument(id: string, request: UpdateWorldDocumentRequest): Promise<ApiResponse<WorldDocument>>;
    deleteDocument(id: string): Promise<ApiResponse<void>>;
  };

  models: {
    listByOasisBioId(oasisBioId: string): Promise<ApiResponse<ModelItem[]>>;
  };

  settings: {
    getSettings(): Promise<ApiResponse<any>>;
    updateSettings(request: UpdateSettingsRequest): Promise<ApiResponse<any>>;
  };

  dashboard: {
    getDashboard(): Promise<ApiResponse<any>>;
  };
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiError';
    this.code = error.code;
    this.statusCode = 500;
    this.details = error.details;
  }
}
