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
import { cacheService, CacheEntry } from './cache'
import { offlineService } from './offlineService'
import { globalDeduplicator, createApiRequestKey, RequestDeduplicator } from '../utils/requestDedup'
import { globalCancellationManager, CancelledError, isCancelledError } from '../utils/requestCancellation'
import { OasisBioError, ERROR_CODES, isOasisBioError, shouldRetry } from '../utils/errors'
import { performanceMonitor, PerformanceMetric } from '../utils/performance'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:3000'
const DEFAULT_TIMEOUT = 30000

export interface RequestOptions {
  cacheKey?: string
  skipCache?: boolean
  ttl?: number
  tags?: string[]
  signal?: AbortSignal
  dedupe?: boolean
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  dedupeInterval?: number
  onLoadingSlow?: () => void
  slowTimeout?: number
}

export interface SWROptions<T> extends RequestOptions {
  fallbackData?: T
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  onErrorRetry?: (error: Error, key: string, config: SWROptions<T>) => void | Promise<void>
  shouldRetryOnError?: boolean
  errorRetryInterval?: number
  errorRetryCount?: number
  revalidateOnMount?: boolean
  refreshInterval?: number
  refreshWhenHidden?: boolean
  refreshWhenOffline?: boolean
  keepPreviousData?: boolean
}

interface RequestState<T> {
  data: T | undefined
  error: Error | undefined
  isLoading: boolean
  isValidating: boolean
  cachedAt: number | null
  cacheKey: string
}

class ApiClient implements OasisBioApiClient {
  private localDeduplicator: RequestDeduplicator
  private perfMonitor = performanceMonitor

  constructor() {
    this.localDeduplicator = new RequestDeduplicator(100)
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const session = await getSession()
    const cacheKey = options?.cacheKey || createApiRequestKey(method, endpoint, body)
    const startTime = performance.now()

    this.perfMonitor.startMeasure(`api-${cacheKey}`)

    if (!options?.skipCache && method === 'GET') {
      const cached = cacheService.get<ApiResponse<T>>(cacheKey)
      if (cached) {
        this.recordMetric(`api-${cacheKey}`, startTime, 'cache-hit', { cacheKey, endpoint })
        return cached
      }
    }

    if (!offlineService.getOnlineStatus() && method === 'GET') {
      const cached = cacheService.get<ApiResponse<T>>(cacheKey)
      if (cached) {
        return cached
      }
      throw new OfflineError('No cached data available while offline')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`
    }

    const fetcher = async (): Promise<ApiResponse<T>> => {
      const controller = new AbortController()
      const signal = options?.signal
        ? this.combineSignals(options.signal, controller.signal)
        : controller.signal

      const requestKey = `${method}:${endpoint}`
      const dedupeTtl = options?.dedupeInterval ?? 100

      const deduplicatedFetch = () => this.localDeduplicator.dedupe(
        requestKey,
        async () => {
          try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
              method,
              headers,
              body: body ? JSON.stringify(body) : undefined,
              signal
            })

            const data = await response.json()

            if (!response.ok) {
              throw new ApiClientError(
                data.message || 'API request failed',
                response.status,
                data.code
              )
            }

            const result: ApiResponse<T> = data

            if (method === 'GET') {
              cacheService.set(cacheKey, result, { ttl: options?.ttl, tags: options?.tags })
            }

            return result
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              throw new CancelledError(cacheKey)
            }
            throw error
          }
        },
        { ttl: dedupeTtl }
      )

      return deduplicatedFetch()
    }

    let slowTimeoutId: ReturnType<typeof setTimeout> | null = null

    if (options?.slowTimeout && options?.onLoadingSlow) {
      slowTimeoutId = setTimeout(() => {
        options.onLoadingSlow?.()
      }, options.slowTimeout)
    }

    try {
      let result: ApiResponse<T>

      if (options?.dedupe !== false && method === 'GET') {
        result = await globalDeduplicator.dedupe(cacheKey, fetcher, {
          ttl: dedupeTtl,
          signal: options?.signal
        })
      } else {
        result = await fetcher()
      }

      if (slowTimeoutId) {
        clearTimeout(slowTimeoutId)
      }

      this.recordMetric(`api-${cacheKey}`, startTime, 'success', {
        cacheKey,
        endpoint,
        method
      })

      return result
    } catch (error) {
      if (slowTimeoutId) {
        clearTimeout(slowTimeoutId)
      }

      this.recordMetric(`api-${cacheKey}`, startTime, 'error', {
        cacheKey,
        endpoint,
        method,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      if (isCancelledError(error)) {
        throw error
      }

      if (method === 'GET') {
        const cached = cacheService.get<ApiResponse<T>>(cacheKey)
        if (cached) {
          return cached
        }
      }

      if (!offlineService.getOnlineStatus() && method !== 'GET') {
        await offlineService.queueAction(
          `api-${endpoint}`,
          `${API_BASE_URL}${endpoint}`,
          method,
          body
        )
        throw new OfflineError('Request queued for later sync')
      }

      throw error
    }
  }

  private dedupeTtl = 100

  private recordMetric(
    name: string,
    startTime: number,
    status: 'success' | 'error' | 'cache-hit',
    metadata: Record<string, unknown>
  ): void {
    const duration = performance.now() - startTime
    this.perfMonitor.addMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'api',
      metadata: { ...metadata, status }
    })

    if (duration > 1000) {
      console.warn(`⚠️ Slow API call detected: ${name} took ${duration.toFixed(2)}ms`)
    }
  }

  private combineSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
    const controller = new AbortController()

    const abort = () => controller.abort()
    signal1.addEventListener('abort', abort)
    signal2.addEventListener('abort', abort)

    return controller.signal
  }

  public createAbortController(key: string): AbortController {
    return globalCancellationManager.createController(key)
  }

  public abortRequest(key: string): void {
    globalCancellationManager.abort(key)
  }

  public abortAllRequests(): void {
    globalCancellationManager.abortAll()
  }

  public auth = {
    loginWithOtp: async (request: LoginWithOtpRequest): Promise<ApiResponse<void>> => {
      return this.request<void>('POST', '/api/auth/login-otp', request, { skipCache: true })
    },
    verifyOtp: async (request: VerifyOtpRequest): Promise<ApiResponse<{ session: unknown }>> => {
      return this.request<{ session: unknown }>('POST', '/api/auth/verify-otp', request, { skipCache: true })
    },
    register: async (request: RegisterRequest): Promise<ApiResponse<void>> => {
      return this.request<void>('POST', '/api/auth/register', request, { skipCache: true })
    },
    logout: async (): Promise<void> => {
      cacheService.clear()
      globalDeduplicator.clear()
      globalCancellationManager.abortAll()
      this.localDeduplicator.clear()
    }
  }

  public profile = {
    getProfile: async (options?: RequestOptions): Promise<ApiResponse<{ user: User; profile: Profile }>> => {
      return this.request<{ user: User; profile: Profile }>('GET', '/api/profile', undefined, {
        cacheKey: 'profile',
        ...options
      })
    },
    updateProfile: async (request: UpdateProfileRequest): Promise<ApiResponse<Profile>> => {
      const result = await this.request<Profile>('PUT', '/api/profile', request)
      cacheService.delete('profile')
      cacheService.clearByTag('profile')
      return result
    }
  }

  public oasisBios = {
    list: async (options?: RequestOptions): Promise<ApiResponse<OasisBio[]>> => {
      return this.request<OasisBio[]>('GET', '/api/oasisbios', undefined, {
        cacheKey: 'oasisbios-list',
        tags: ['oasisbio'],
        ...options
      })
    },
    create: async (request: CreateOasisBioRequest): Promise<ApiResponse<OasisBio>> => {
      const result = await this.request<OasisBio>('POST', '/api/oasisbios', request)
      cacheService.delete('oasisbios-list')
      cacheService.clearByTag('oasisbio')
      return result
    },
    getById: async (id: string, options?: RequestOptions): Promise<ApiResponse<OasisBio>> => {
      return this.request<OasisBio>('GET', `/api/oasisbios/${id}`, undefined, {
        cacheKey: `oasisbio-${id}`,
        tags: ['oasisbio'],
        ...options
      })
    },
    update: async (id: string, request: UpdateOasisBioRequest): Promise<ApiResponse<OasisBio>> => {
      const result = await this.request<OasisBio>('PUT', `/api/oasisbios/${id}`, request)
      cacheService.delete('oasisbios-list')
      cacheService.delete(`oasisbio-${id}`)
      cacheService.clearByTag('oasisbio')
      return result
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      const result = await this.request<void>('DELETE', `/api/oasisbios/${id}`)
      cacheService.delete('oasisbios-list')
      cacheService.delete(`oasisbio-${id}`)
      cacheService.clearByTag('oasisbio')
      return result
    },
    publish: async (id: string, request: PublishBioRequest): Promise<ApiResponse<unknown>> => {
      return this.request<unknown>('POST', `/api/oasisbios/${id}/publish`, request)
    }
  }

  public abilities = {
    listByOasisBioId: async (oasisBioId: string, options?: RequestOptions): Promise<ApiResponse<Ability[]>> => {
      return this.request<Ability[]>('GET', `/api/oasisbios/${oasisBioId}/abilities`, undefined, {
        cacheKey: `abilities-${oasisBioId}`,
        tags: ['ability', `oasisbio-${oasisBioId}`],
        ...options
      })
    },
    create: async (oasisBioId: string, request: CreateAbilityRequest): Promise<ApiResponse<Ability>> => {
      const result = await this.request<Ability>('POST', `/api/oasisbios/${oasisBioId}/abilities`, request)
      cacheService.delete(`abilities-${oasisBioId}`)
      cacheService.clearByTag('ability')
      return result
    },
    update: async (id: string, request: UpdateAbilityRequest): Promise<ApiResponse<Ability>> => {
      return this.request<Ability>('PUT', `/api/abilities/${id}`, request)
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return this.request<void>('DELETE', `/api/abilities/${id}`)
    }
  }

  public dcosFiles = {
    listByOasisBioId: async (oasisBioId: string, options?: RequestOptions): Promise<ApiResponse<DcosFile[]>> => {
      return this.request<DcosFile[]>('GET', `/api/oasisbios/${oasisBioId}/dcos`, undefined, {
        cacheKey: `dcos-${oasisBioId}`,
        tags: ['dcos', `oasisbio-${oasisBioId}`],
        ...options
      })
    },
    create: async (oasisBioId: string, request: CreateDcosRequest): Promise<ApiResponse<DcosFile>> => {
      const result = await this.request<DcosFile>('POST', `/api/oasisbios/${oasisBioId}/dcos`, request)
      cacheService.delete(`dcos-${oasisBioId}`)
      cacheService.clearByTag('dcos')
      return result
    },
    update: async (id: string, request: UpdateDcosRequest): Promise<ApiResponse<DcosFile>> => {
      return this.request<DcosFile>('PUT', `/api/dcos/${id}`, request)
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return this.request<void>('DELETE', `/api/dcos/${id}`)
    }
  }

  public references = {
    listByOasisBioId: async (oasisBioId: string, options?: RequestOptions): Promise<ApiResponse<ReferenceItem[]>> => {
      return this.request<ReferenceItem[]>('GET', `/api/oasisbios/${oasisBioId}/references`, undefined, {
        cacheKey: `references-${oasisBioId}`,
        tags: ['reference', `oasisbio-${oasisBioId}`],
        ...options
      })
    },
    create: async (oasisBioId: string, request: CreateReferenceRequest): Promise<ApiResponse<ReferenceItem>> => {
      const result = await this.request<ReferenceItem>('POST', `/api/oasisbios/${oasisBioId}/references`, request)
      cacheService.delete(`references-${oasisBioId}`)
      cacheService.clearByTag('reference')
      return result
    },
    update: async (id: string, request: UpdateReferenceRequest): Promise<ApiResponse<ReferenceItem>> => {
      return this.request<ReferenceItem>('PUT', `/api/references/${id}`, request)
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return this.request<void>('DELETE', `/api/references/${id}`)
    }
  }

  public eras = {
    listByOasisBioId: async (oasisBioId: string, options?: RequestOptions): Promise<ApiResponse<EraIdentity[]>> => {
      return this.request<EraIdentity[]>('GET', `/api/oasisbios/${oasisBioId}/eras`, undefined, {
        cacheKey: `eras-${oasisBioId}`,
        tags: ['era', `oasisbio-${oasisBioId}`],
        ...options
      })
    },
    create: async (oasisBioId: string, request: CreateEraRequest): Promise<ApiResponse<EraIdentity>> => {
      const result = await this.request<EraIdentity>('POST', `/api/oasisbios/${oasisBioId}/eras`, request)
      cacheService.delete(`eras-${oasisBioId}`)
      cacheService.clearByTag('era')
      return result
    },
    update: async (id: string, request: UpdateEraRequest): Promise<ApiResponse<EraIdentity>> => {
      return this.request<EraIdentity>('PUT', `/api/eras/${id}`, request)
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return this.request<void>('DELETE', `/api/eras/${id}`)
    }
  }

  public worlds = {
    listByOasisBioId: async (oasisBioId: string, options?: RequestOptions): Promise<ApiResponse<WorldItem[]>> => {
      return this.request<WorldItem[]>('GET', `/api/oasisbios/${oasisBioId}/worlds`, undefined, {
        cacheKey: `worlds-${oasisBioId}`,
        tags: ['world', `oasisbio-${oasisBioId}`],
        ...options
      })
    },
    create: async (oasisBioId: string, request: CreateWorldRequest): Promise<ApiResponse<WorldItem>> => {
      const result = await this.request<WorldItem>('POST', `/api/oasisbios/${oasisBioId}/worlds`, request)
      cacheService.delete(`worlds-${oasisBioId}`)
      cacheService.clearByTag('world')
      return result
    },
    getById: async (id: string, options?: RequestOptions): Promise<ApiResponse<WorldItem>> => {
      return this.request<WorldItem>('GET', `/api/worlds/${id}`, undefined, {
        cacheKey: `world-${id}`,
        tags: ['world'],
        ...options
      })
    },
    update: async (id: string, request: UpdateWorldRequest): Promise<ApiResponse<WorldItem>> => {
      const result = await this.request<WorldItem>('PUT', `/api/worlds/${id}`, request)
      cacheService.delete(`world-${id}`)
      cacheService.clearByTag('world')
      return result
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      const result = await this.request<void>('DELETE', `/api/worlds/${id}`)
      cacheService.delete(`world-${id}`)
      cacheService.clearByTag('world')
      return result
    },
    listDocuments: async (worldId: string, options?: RequestOptions): Promise<ApiResponse<WorldDocument[]>> => {
      return this.request<WorldDocument[]>('GET', `/api/worlds/${worldId}/documents`, undefined, {
        cacheKey: `world-docs-${worldId}`,
        tags: ['world-document', `world-${worldId}`],
        ...options
      })
    },
    createDocument: async (worldId: string, request: CreateWorldDocumentRequest): Promise<ApiResponse<WorldDocument>> => {
      const result = await this.request<WorldDocument>('POST', `/api/worlds/${worldId}/documents`, request)
      cacheService.delete(`world-docs-${worldId}`)
      cacheService.clearByTag('world-document')
      return result
    },
    updateDocument: async (id: string, request: UpdateWorldDocumentRequest): Promise<ApiResponse<WorldDocument>> => {
      return this.request<WorldDocument>('PUT', `/api/world-documents/${id}`, request)
    },
    deleteDocument: async (id: string): Promise<ApiResponse<void>> => {
      return this.request<void>('DELETE', `/api/world-documents/${id}`)
    }
  }

  public models = {
    listByOasisBioId: async (oasisBioId: string, options?: RequestOptions): Promise<ApiResponse<ModelItem[]>> => {
      return this.request<ModelItem[]>('GET', `/api/oasisbios/${oasisBioId}/models`, undefined, {
        cacheKey: `models-${oasisBioId}`,
        tags: ['model', `oasisbio-${oasisBioId}`],
        ...options
      })
    }
  }

  public settings = {
    getSettings: async (options?: RequestOptions): Promise<ApiResponse<unknown>> => {
      return this.request<unknown>('GET', '/api/settings', undefined, {
        cacheKey: 'settings',
        ...options
      })
    },
    updateSettings: async (request: UpdateSettingsRequest): Promise<ApiResponse<unknown>> => {
      const result = await this.request<unknown>('PUT', '/api/settings', request)
      cacheService.delete('settings')
      return result
    }
  }

  public dashboard = {
    getDashboard: async (options?: RequestOptions): Promise<ApiResponse<unknown>> => {
      return this.request<unknown>('GET', '/api/dashboard', undefined, {
        cacheKey: 'dashboard',
        ...options
      })
    }
  }

  public cache = {
    clear: () => cacheService.clear(),
    clearByTag: (tag: string) => cacheService.clearByTag(tag),
    clearByPattern: (pattern: RegExp) => cacheService.clearByPattern(pattern),
    getStats: () => cacheService.getStats(),
    getHitRate: () => cacheService.getHitRate()
  }

  public offline = {
    isOnline: () => offlineService.getOnlineStatus(),
    getQueueLength: () => offlineService.getQueueLength(),
    getPendingActions: () => offlineService.getPendingActions(),
    sync: () => offlineService.syncOfflineActions(),
    subscribe: (listener: (isOnline: boolean) => void) => offlineService.subscribe(listener)
  }
}

export class ApiClientError extends OasisBioError {
  constructor(
    message: string,
    statusCode: number,
    code?: string
  ) {
    const errorCode = mapStatusCodeToErrorCode(statusCode)
    super(message, { code: code || errorCode, statusCode })
    this.name = 'ApiClientError'
  }
}

function mapStatusCodeToErrorCode(status: number): string {
  switch (status) {
    case 400:
      return ERROR_CODES.VALIDATION_ERROR
    case 401:
    case 403:
      return ERROR_CODES.UNAUTHORIZED
    case 404:
      return ERROR_CODES.NOT_FOUND
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_CODES.INTERNAL_ERROR
    default:
      return ERROR_CODES.INTERNAL_ERROR
  }
}

export function createNetworkError(error: Error): OasisBioError {
  if (error.name === 'AbortError') {
    return new OasisBioError('Request timed out. Please try again.', {
      code: ERROR_CODES.TIMEOUT
    })
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return new OasisBioError('No internet connection. Please check your network.', {
      code: ERROR_CODES.NETWORK_ERROR
    })
  }
  return new OasisBioError('Network error. Please check your connection.', {
    code: ERROR_CODES.NETWORK_ERROR,
    details: { originalError: error.message }
  })
}

export class OfflineError extends OasisBioError {
  constructor(message: string) {
    super(message, { code: ERROR_CODES.NETWORK_ERROR })
    this.name = 'OfflineError'
  }
}

export function isOfflineError(error: unknown): error is OfflineError {
  return error instanceof OfflineError
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      if (isOasisBioError(error) && shouldRetry(error) && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)))
        continue
      }

      throw error
    }
  }

  throw lastError
}

export const apiClient = new ApiClient()

type FetcherFn<T> = () => Promise<T>

const swrCache = new Map<string, RequestState<unknown>>()

const nullSubscribe = () => () => {}

function useSyncExternalStore2<T>(subscribe: () => () => void, getSnapshot: () => T, getServerSnapshot?: () => T): T {
  const [getSnapshot2, setGetSnapshot] = useState(() => getSnapshot)

  useEffect(() => {
    setGetSnapshot(() => getSnapshot)
  }, [getSnapshot])

  return useSyncExternalStore(subscribe, getSnapshot2, getServerSnapshot ?? getSnapshot)
}

export function useSWR<T>(
  key: string,
  fetcher: FetcherFn<T> | null,
  options: SWROptions<T> = {}
): {
  data: T | undefined
  error: Error | undefined
  isLoading: boolean
  isValidating: boolean
  mutate: () => Promise<T | undefined>
  cacheKey: string
} {
  const {
    fallbackData,
    onSuccess,
    onError,
    shouldRetryOnError = true,
    errorRetryInterval = 5000,
    errorRetryCount = 3,
    revalidateOnMount = true,
    refreshInterval = 0,
    refreshWhenHidden = true,
    refreshWhenOffline = false,
    keepPreviousData = false,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    dedupe = true,
    dedupeInterval = 2000,
    slowTimeout = 3000,
    onLoadingSlow,
    ...requestOptions
  } = options

  const cacheKey = key

  const getSnapshot = useCallback(() => {
    const cached = swrCache.get(cacheKey)
    return cached || {
      data: fallbackData as T | undefined,
      error: undefined,
      isLoading: fetcher !== null && revalidateOnMount,
      isValidating: false,
      cachedAt: null,
      cacheKey
    }
  }, [cacheKey, fallbackData, fetcher, revalidateOnMount])

  const state = useSyncExternalStore2(nullSubscribe, getSnapshot)

  const unmountedRef = useRef(false)
  const resolveRef = useRef<((value: T) => void) | null>(null)
  const rejectRef = useRef<((error: Error) => void) | null>(null)
  const retryCountRef = useRef(0)
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const slowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const getCachedData = useCallback((): T | undefined => {
    const cached = swrCache.get(cacheKey)
    return cached?.data as T | undefined
  }, [cacheKey])

  const revalidate = useCallback(async (): Promise<T | undefined> => {
    if (!fetcher || unmountedRef.current) return getCachedData()

    const currentCache = swrCache.get(cacheKey)
    const previousData = keepPreviousData ? currentCache?.data : undefined

    if (dedupe && globalDeduplicator.hasPending(cacheKey)) {
      return currentCache?.data as T | undefined
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    swrCache.set(cacheKey, {
      data: previousData as T | undefined,
      error: undefined,
      isLoading: true,
      isValidating: true,
      cachedAt: currentCache?.cachedAt || null,
      cacheKey
    })

    if (slowTimeout > 0 && onLoadingSlow) {
      slowTimeoutRef.current = setTimeout(() => {
        onLoadingSlow()
      }, slowTimeout)
    }

    try {
      const result = await globalDeduplicator.dedupe(
        cacheKey,
        () => fetcher(),
        { ttl: dedupeInterval, signal: abortControllerRef.current.signal }
      )

      if (slowTimeoutRef.current) {
        clearTimeout(slowTimeoutRef.current)
      }

      if (!unmountedRef.current) {
        swrCache.set(cacheKey, {
          data: result,
          error: undefined,
          isLoading: false,
          isValidating: false,
          cachedAt: Date.now(),
          cacheKey
        })

        retryCountRef.current = 0
        resolveRef.current?.(result)
        onSuccess?.(result)
      }

      return result
    } catch (error) {
      if (slowTimeoutRef.current) {
        clearTimeout(slowTimeoutRef.current)
      }

      if (unmountedRef.current || isCancelledError(error)) {
        return currentCache?.data as T | undefined
      }

      swrCache.set(cacheKey, {
        data: previousData as T | undefined,
        error: error instanceof Error ? error : new Error('Unknown error'),
        isLoading: false,
        isValidating: false,
        cachedAt: currentCache?.cachedAt || null,
        cacheKey
      })

      rejectRef.current?.(error instanceof Error ? error : new Error('Unknown error'))
      onError?.(error instanceof Error ? error : new Error('Unknown error'))

      if (shouldRetryOnError && retryCountRef.current < errorRetryCount) {
        retryCountRef.current++
        setTimeout(() => {
          if (!unmountedRef.current) {
            revalidate()
          }
        }, errorRetryInterval * retryCountRef.current)
      }

      return previousData as T | undefined
    }
  }, [
    cacheKey,
    fetcher,
    dedupe,
    dedupeInterval,
    keepPreviousData,
    shouldRetryOnError,
    errorRetryCount,
    errorRetryInterval,
    slowTimeout,
    onLoadingSlow,
    onSuccess,
    onError,
    getCachedData
  ])

  useEffect(() => {
    unmountedRef.current = false
    abortControllerRef.current = new AbortController()

    if (fetcher && revalidateOnMount) {
      revalidate()
    }

    return () => {
      unmountedRef.current = true
      abortControllerRef.current?.abort()
      if (slowTimeoutRef.current) {
        clearTimeout(slowTimeoutRef.current)
      }
    }
  }, [cacheKey, fetcher, revalidateOnMount, revalidate])

  useEffect(() => {
    if (!revalidateOnFocus) return

    const handleFocus = () => {
      if (!document.hidden) {
        revalidate()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [revalidateOnFocus, revalidate])

  useEffect(() => {
    if (!revalidateOnReconnect) return

    const handleOnline = () => {
      revalidate()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [revalidateOnReconnect, revalidate])

  useEffect(() => {
    if (refreshInterval <= 0) return

    const shouldRefresh = () => {
      if (!refreshWhenHidden && document.hidden) return false
      if (!refreshWhenOffline && !navigator.onLine) return false
      return true
    }

    refreshIntervalRef.current = setInterval(() => {
      if (shouldRefresh()) {
        revalidate()
      }
    }, refreshInterval)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [refreshInterval, refreshWhenHidden, refreshWhenOffline, revalidate])

  return {
    data: (state as RequestState<T>).data,
    error: (state as RequestState<T>).error,
    isLoading: (state as RequestState<T>).isLoading,
    isValidating: (state as RequestState<T>).isValidating,
    mutate: revalidate,
    cacheKey
  }
}

export function mutateCache(key: string): Promise<void> {
  const cached = swrCache.get(key)
  if (cached) {
    swrCache.set(key, {
      ...cached,
      isValidating: true
    })
  }
  return Promise.resolve()
}

export function prefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { dedupe?: boolean; ttl?: number } = {}
): void {
  if (options.dedupe !== false && globalDeduplicator.hasPending(key)) {
    return
  }

  const controller = new AbortController()

  globalDeduplicator.dedupe(key, () => fetcher(), { ttl: options.ttl ?? 5000, signal: controller.signal })
    .catch(() => {})
}

export function invalidateCache(key: string): void {
  swrCache.delete(key)
  cacheService.delete(key)
}

export function clearSWRCache(): void {
  swrCache.clear()
}

export function getCacheStats() {
  return {
    swr: {
      size: swrCache.size,
      keys: Array.from(swrCache.keys())
    },
    storage: cacheService.getStats(),
    hitRate: cacheService.getHitRate()
  }
}
