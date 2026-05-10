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
    register(request: RegisterRequest): Promise<Api