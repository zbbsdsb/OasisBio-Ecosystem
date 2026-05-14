import type { OasisBioApiClient } from '@oasisbio/common-api'
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
} from '@oasisbio/common-core'
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
} from '@oasisbio/common-core'
import { getSession } from './auth'
import { cacheService } from './cache'

const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:3000'

class ApiClient implements OasisBioApiClient {
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any,
    options?: { cacheKey?: string; skipCache?: boolean }
  ): Promise<ApiResponse<T>> {
    const session = await getSession()
    const cacheKey = options?.cacheKey || `${method}:${endpoint}`

    if (!options?.skipCache && method === 'GET') {
      const cached = cacheService.get<ApiResponse<T>>(cacheKey)
      if (cached) {
        return cached
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'API request failed')
      }

      const result: ApiResponse<T> = data

      if (method === 'GET') {
        cacheService.set(cacheKey, result)
      }

      return result
    } catch (error) {
      if (method === 'GET') {
        const cached = cacheService.get<ApiResponse<T>>(cacheKey)
        if (cached) {
          return cached
        }
      }
      throw error
    }
  }

  public auth = {
    loginWithOtp: async (request: LoginWithOtpRequest): Promise<ApiResponse<void>> => {
      return this.request<void>('POST', '/api/auth/login-otp', request, { skipCache: true })
    },
    verifyOtp: async (request: VerifyOtpRequest): Promise<ApiResponse<{ session: any }>> => {
      return this.request<{ session: any }>('POST', '/api/auth/verify-otp', request, { skipCache: true })
    },
    register: async (request: RegisterRequest): Promise<ApiResponse<void>> => {
      return this.request<void>('POST', '/api/auth/register', request, { skipCache: true })
    },
    logout: async (): Promise<void> => {
      cacheService.clear()
    }
  }

  public profile = {
    getProfile: async (): Promise<ApiResponse<{ user: User; profile: Profile }>> => {
      return this.request<{ user: User; profile: Profile }>('GET', '/api/profile', undefined, { cacheKey: 'profile' })
    },
    updateProfile: async (request: UpdateProfileRequest): Promise<ApiResponse<Profile>> => {
      const result = await this.request<Profile>('PUT', '/api/profile', request)
      cacheService.delete('profile')
      return result
    }
  }

  public oasisBios = {
    list: async (): Promise<ApiResponse<OasisBio[]>> => {
      return this.request<OasisBio[]>('GET', '/api/oasisbios', undefined, { cacheKey: 'oasisbios-list' })
    },
    create: async (request: CreateOasisBioRequest): Promise<ApiResponse<OasisBio>> => {
      const result = await this.request<OasisBio>('POST', '/api/oasisbios', request)
      cacheService.delete('oasisbios-list')
      return result
    },
    getById: async (id: string): Promise<ApiResponse<OasisBio>> => {
      return this.request<OasisBio>('GET', `/api/oasisbios/${id}`, undefined, { cacheKey: `oasisbio-${id}` })
    },
    update: async (id: string, request: UpdateOasisBioRequest): Promise<ApiResponse<OasisBio>> => {
      const result = await this.request<OasisBio>('PUT', `/api/oasisbios/${id}`, request)
      cacheService.delete('oasisbios-list')
      cacheService.delete(`oasisbio-${id}`)
      return result
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      const result = await this.request<void>('DELETE', `/api/oasisbios/${id}`)
      cacheService.delete('oasisbios-list')
      cacheService.delete(`oasisbio-${id}`)
      return result
    },
    publish: async (id: string, request: PublishBioRequest): Promise<ApiResponse<any>> => {
      return this.request<any>('POST', `/api/oasisbios/${id}/publish`, request)
    }
  }

  public abilities = {
    listByOasisBioId: async (oasisBioId: string): Promise<ApiResponse<Ability[]>> => {
      return this.request<Ability[]>('GET', `/api/oasisbios/${oasisBioId}/abilities`, undefined, { cacheKey: `abilities-${oasisBioId}` })
    },
    create: async (oasisBioId: string, request: CreateAbilityRequest): Promise<ApiResponse<Ability>> => {
      const result = await this.request<Ability>('POST', `/api/oasisbios/${oasisBioId}/abilities`, request)
      cacheService.delete(`abilities-${oasisBioId}`)
      return result
    },
    update: async (id: string, request: UpdateAbilityRequest): Promise<ApiResponse<Ability>> => {
      const result = await this.request<Ability>('PUT', `/api/abilities/${id}`, request)
      return result
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return this.request<void>('DELETE', `/api/abilities/${id}`)
    }
  }

  public dcosFiles = {
    listByOasisBioId: async (oasisBioId: string): Promise<ApiResponse<DcosFile[]>> => {
      return this.request<DcosFile[]>('GET', `/api/oasisbios/${oasisBioId}/dcos`, undefined, { cacheKey: `dcos-${oasisBioId}` })
    },
    create: async (oasisBioId: string, request: CreateDcosRequest): Promise<ApiResponse<DcosFile>> => {
      const result = await this.request<DcosFile>('POST', `/api/oasisbios/${oasisBioId}/dcos`, request)
      cacheService.delete(`dcos-${oasisBioId}`)
      return result
    },
    update: async (id: string, request: UpdateDcosRequest): Promise<ApiResponse<DcosFile>> => {
      const result = await this.request<DcosFile>('PUT', `/api/dcos/${id}`, request)
      return result
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return this.request<void>('DELETE', `/api/dcos/${id}`)
    }
  }

  public references = {
    listByOasisBioId: async (oasisBioId: string): Promise<ApiResponse<ReferenceItem[]>> => {
      return this.request<ReferenceItem[]>('GET', `/api/oasisbios/${oasisBioId}/references`, undefined, { cacheKey: `references-${oasisBioId}` })
    },
    create: async (oasisBioId: string, request: CreateReferenceRequest): Promise<ApiResponse<ReferenceItem>> => {
      const result = await this.request<ReferenceItem>('POST', `/api/oasisbios/${oasisBioId}/references`, request)
      cacheService.delete(`references-${oasisBioId}`)
      return result
    },
    update: async (id: string, request: UpdateReferenceRequest): Promise<ApiResponse<ReferenceItem>> => {
      const result = await this.request<ReferenceItem>('PUT', `/api/references/${id}`, request)
      return result
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return this.request<void>('DELETE', `/api/references/${id}`)
    }
  }

  public eras = {
    listByOasisBioId: async (oasisBioId: string): Promise<ApiResponse<EraIdentity[]>> => {
      return this.request<EraIdentity[]>('GET', `/api/oasisbios/${oasisBioId}/eras`, undefined, { cacheKey: `eras-${oasisBioId}` })
    },
    create: async (oasisBioId: string, request: CreateEraRequest): Promise<ApiResponse<EraIdentity>> => {
      const result = await this.request<EraIdentity>('POST', `/api/oasisbios/${oasisBioId}/eras`, request)
      cacheService.delete(`eras-${oasisBioId}`)
      return result
    },
    update: async (id: string, request: UpdateEraRequest): Promise<ApiResponse<EraIdentity>> => {
      const result = await this.request<EraIdentity>('PUT', `/api/eras/${id}`, request)
      return result
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return this.request<void>('DELETE', `/api/eras/${id}`)
    }
  }

  public worlds = {
    listByOasisBioId: async (oasisBioId: string): Promise<ApiResponse<WorldItem[]>> => {
      return this.request<WorldItem[]>('GET', `/api/oasisbios/${oasisBioId}/worlds`, undefined, { cacheKey: `worlds-${oasisBioId}` })
    },
    create: async (oasisBioId: string, request: CreateWorldRequest): Promise<ApiResponse<WorldItem>> => {
      const result = await this.request<WorldItem>('POST', `/api/oasisbios/${oasisBioId}/worlds`, request)
      cacheService.delete(`worlds-${oasisBioId}`)
      return result
    },
    getById: async (id: string): Promise<ApiResponse<WorldItem>> => {
      return this.request<WorldItem>('GET', `/api/worlds/${id}`, undefined, { cacheKey: `world-${id}` })
    },
    update: async (id: string, request: UpdateWorldRequest): Promise<ApiResponse<WorldItem>> => {
      const result = await this.request<WorldItem>('PUT', `/api/worlds/${id}`, request)
      cacheService.delete(`world-${id}`)
      return result
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      const result = await this.request<void>('DELETE', `/api/worlds/${id}`)
      cacheService.delete(`world-${id}`)
      return result
    },
    listDocuments: async (worldId: string): Promise<ApiResponse<WorldDocument[]>> => {
      return this.request<WorldDocument[]>('GET', `/api/worlds/${worldId}/documents`, undefined, { cacheKey: `world-docs-${worldId}` })
    },
    createDocument: async (worldId: string, request: CreateWorldDocumentRequest): Promise<ApiResponse<WorldDocument>> => {
      const result = await this.request<WorldDocument>('POST', `/api/worlds/${worldId}/documents`, request)
      cacheService.delete(`world-docs-${worldId}`)
      return result
    },
    updateDocument: async (id: string, request: UpdateWorldDocumentRequest): Promise<ApiResponse<WorldDocument>> => {
      const result = await this.request<WorldDocument>('PUT', `/api/world-documents/${id}`, request)
      return result
    },
    deleteDocument: async (id: string): Promise<ApiResponse<void>> => {
      return this.request<void>('DELETE', `/api/world-documents/${id}`)
    }
  }

  public models = {
    listByOasisBioId: async (oasisBioId: string): Promise<ApiResponse<ModelItem[]>> => {
      return this.request<ModelItem[]>('GET', `/api/oasisbios/${oasisBioId}/models`, undefined, { cacheKey: `models-${oasisBioId}` })
    }
  }

  public settings = {
    getSettings: async (): Promise<ApiResponse<any>> => {
      return this.request<any>('GET', '/api/settings', undefined, { cacheKey: 'settings' })
    },
    updateSettings: async (request: UpdateSettingsRequest): Promise<ApiResponse<any>> => {
      const result = await this.request<any>('PUT', '/api/settings', request)
      cacheService.delete('settings')
      return result
    }
  }

  public dashboard = {
    getDashboard: async (): Promise<ApiResponse<any>> => {
      return this.request<any>('GET', '/api/dashboard', undefined, { cacheKey: 'dashboard' })
    }
  }
}

export const apiClient = new ApiClient()
