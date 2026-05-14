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
  RegisterRequest,
  CreateAssistantSessionRequest,
  UpdateAssistantSessionRequest,
  SendChatMessageRequest,
  UpdateAssistantProfileRequest,
  UpdateAssistantPermissionRequest
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
  ModelItem,
  AssistantMessage
} from '@oasisbio/common-core';
import type {
  AssistantSessionSummary,
  AssistantSessionDetail,
  CreateSessionResponse,
  SessionListResponse,
  MessageListResponse,
  ChatResponse,
  AssistantProfileResponse,
  AssistantPermissionResponse
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

  assistants: {
    sessions: {
      list(): Promise<ApiResponse<SessionListResponse>>;
      create(request: CreateAssistantSessionRequest): Promise<ApiResponse<CreateSessionResponse>>;
      getById(id: string): Promise<ApiResponse<AssistantSessionDetail>>;
      update(id: string, request: UpdateAssistantSessionRequest): Promise<ApiResponse<AssistantSessionDetail>>;
      delete(id: string): Promise<ApiResponse<void>>;
    };
    chat(request: SendChatMessageRequest): Promise<ApiResponse<ChatResponse>>;
    messages: {
      list(sessionId: string): Promise<ApiResponse<MessageListResponse>>;
    };
    profiles: {
      get(): Promise<ApiResponse<AssistantProfileResponse>>;
      update(request: UpdateAssistantProfileRequest): Promise<ApiResponse<{ success: boolean }>>;
    };
    permissions: {
      get(): Promise<ApiResponse<AssistantPermissionResponse>>;
      update(request: UpdateAssistantPermissionRequest): Promise<ApiResponse<AssistantPermissionResponse>>;
    };
  };
}
