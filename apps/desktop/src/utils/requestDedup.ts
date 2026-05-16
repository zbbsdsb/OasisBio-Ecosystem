type RequestKey = string
type PendingRequest<T> = {
  promise: Promise<T>
  timestamp: number
  abortController?: AbortController
}

interface DedupOptions {
  ttl?: number
  generateKey?: (...args: unknown[]) => string
}

const DEFAULT_DEDUP_TTL = 100

export class RequestDeduplicator {
  private pendingRequests: Map<RequestKey, PendingRequest<unknown>> = new Map()
  private defaultTtl: number

  constructor(defaultTtl: number = DEFAULT_DEDUP_TTL) {
    this.defaultTtl = defaultTtl
  }

  private cleanupExpired(): void {
    const now = Date.now()
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.defaultTtl) {
        this.pendingRequests.delete(key)
      }
    }
  }

  dedupe<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; signal?: AbortSignal }
  ): Promise<T> {
    this.cleanupExpired()

    const existing = this.pendingRequests.get(key) as PendingRequest<T> | undefined
    if (existing) {
      return existing.promise
    }

    const promise = fetcher()
      .then((result) => {
        this.pendingRequests.delete(key)
        return result
      })
      .catch((error) => {
        this.pendingRequests.delete(key)
        throw error
      })

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    })

    return promise
  }

  createDedupeFetcher<TArgs extends unknown[], TResult>(
    fetcher: (...args: TArgs) => Promise<TResult>,
    keyGenerator: (...args: TArgs) => string
  ): (...args: TArgs) => Promise<TResult> {
    return (...args: TArgs): Promise<TResult> => {
      const key = keyGenerator(...args)
      return this.dedupe(key, () => fetcher(...args))
    }
  }

  hasPending(key: string): boolean {
    const existing = this.pendingRequests.get(key)
    return existing !== undefined && Date.now() - existing.timestamp <= this.defaultTtl
  }

  clear(): void {
    this.pendingRequests.clear()
  }

  clearByKey(key: string): void {
    this.pendingRequests.delete(key)
  }

  clearByPattern(pattern: RegExp): void {
    for (const key of this.pendingRequests.keys()) {
      if (pattern.test(key)) {
        this.pendingRequests.delete(key)
      }
    }
  }

  getPendingCount(): number {
    return this.pendingRequests.size
  }

  getPendingKeys(): string[] {
    return Array.from(this.pendingRequests.keys())
  }
}

export const globalDeduplicator = new RequestDeduplicator()

export function dedupeRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): Promise<T> {
  return globalDeduplicator.dedupe(key, fetcher, options)
}

export function createDedupeKey(...parts: (string | number | undefined | null)[]): string {
  return parts
    .filter((part) => part !== undefined && part !== null)
    .map((part) => String(part))
    .join(':')
}

export function createApiRequestKey(
  method: string,
  endpoint: string,
  body?: unknown
): string {
  const bodyHash = body ? JSON.stringify(body) : ''
  return `${method}:${endpoint}:${bodyHash}`
}
