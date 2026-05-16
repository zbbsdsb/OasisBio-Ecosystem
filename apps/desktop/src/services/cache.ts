interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  version: string
  tags?: string[]
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  oldestEntry: number | null
}

interface CacheOptions {
  ttl?: number
  tags?: string[]
}

const CACHE_KEY_PREFIX = 'oasisbio-cache-'
const CACHE_VERSION_KEY = 'oasisbio-cache-version'
const CACHE_STATS_KEY = 'oasisbio-cache-stats'
const DEFAULT_TTL = 5 * 60 * 1000
const CURRENT_VERSION = '1.0.0'

export class CacheService {
  private static instance: CacheService
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, oldestEntry: null }
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  private constructor() {
    this.checkVersion()
    this.loadStats()
    this.startCleanupInterval()
  }

  private checkVersion(): void {
    try {
      const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
      if (storedVersion !== CURRENT_VERSION) {
        this.clearAll()
        localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION)
      }
    } catch {
      this.clearAll()
    }
  }

  private loadStats(): void {
    try {
      const stored = localStorage.getItem(CACHE_STATS_KEY)
      if (stored) {
        this.stats = JSON.parse(stored)
      }
    } catch {
      this.stats = { hits: 0, misses: 0, size: 0, oldestEntry: null }
    }
  }

  private saveStats(): void {
    try {
      localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(this.stats))
    } catch {
      // Ignore stats save errors
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.clearExpired()
    }, 60 * 1000)
  }

  public stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  private getKey(key: string): string {
    return `${CACHE_KEY_PREFIX}${key}`
  }

  public get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key))
      if (!item) {
        this.stats.misses++
        this.saveStats()
        return null
      }

      const entry: CacheEntry<T> = JSON.parse(item)
      const now = Date.now()

      if (now > entry.timestamp + entry.ttl) {
        this.delete(key)
        this.stats.misses++
        this.saveStats()
        return null
      }

      if (entry.version !== CURRENT_VERSION) {
        this.delete(key)
        this.stats.misses++
        this.saveStats()
        return null
      }

      this.stats.hits++
      this.saveStats()
      return entry.data
    } catch {
      this.stats.misses++
      this.saveStats()
      return null
    }
  }

  public set<T>(key: string, data: T, options?: CacheOptions): void {
    try {
      const ttl = options?.ttl ?? DEFAULT_TTL
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        version: CURRENT_VERSION,
        tags: options?.tags
      }
      localStorage.setItem(this.getKey(key), JSON.stringify(entry))
      this.updateSizeStats()
    } catch (error) {
      if (this.isQuotaExceeded(error)) {
        this.handleQuotaExceeded()
        try {
          localStorage.setItem(this.getKey(key), JSON.stringify({
            data,
            timestamp: Date.now(),
            ttl: options?.ttl ?? DEFAULT_TTL,
            version: CURRENT_VERSION,
            tags: options?.tags
          }))
        } catch {
          console.error('Failed to set cache after cleanup:', error)
        }
      } else {
        console.error('Failed to set cache:', error)
      }
    }
  }

  private isQuotaExceeded(error: unknown): boolean {
    return error instanceof DOMException && 
      (error.name === 'QuotaExceededError' || 
       error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  }

  private handleQuotaExceeded(): void {
    this.clearExpired()
    if (this.stats.size > 0) {
      this.clearOldestEntries(Math.floor(this.stats.size / 2))
    }
  }

  public delete(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key))
      this.updateSizeStats()
    } catch (error) {
      console.error('Failed to delete cache:', error)
    }
  }

  public clear(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
      this.stats = { hits: 0, misses: 0, size: 0, oldestEntry: null }
      this.saveStats()
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  private clearAll(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX) || 
            key === CACHE_VERSION_KEY || 
            key === CACHE_STATS_KEY) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Failed to clear all cache:', error)
    }
  }

  public clearExpired(): void {
    try {
      const keys = Object.keys(localStorage)
      const now = Date.now()
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          const item = localStorage.getItem(key)
          if (item) {
            try {
              const entry: CacheEntry<unknown> = JSON.parse(item)
              if (now > entry.timestamp + entry.ttl || entry.version !== CURRENT_VERSION) {
                localStorage.removeItem(key)
              }
            } catch {
              localStorage.removeItem(key)
            }
          }
        }
      })
      this.updateSizeStats()
    } catch (error) {
      console.error('Failed to clear expired cache:', error)
    }
  }

  public clearByTag(tag: string): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          const item = localStorage.getItem(key)
          if (item) {
            try {
              const entry: CacheEntry<unknown> = JSON.parse(item)
              if (entry.tags?.includes(tag)) {
                localStorage.removeItem(key)
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      })
      this.updateSizeStats()
    } catch (error) {
      console.error('Failed to clear cache by tag:', error)
    }
  }

  public clearByPattern(pattern: RegExp): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          const cacheKey = key.slice(CACHE_KEY_PREFIX.length)
          if (pattern.test(cacheKey)) {
            localStorage.removeItem(key)
          }
        }
      })
      this.updateSizeStats()
    } catch (error) {
      console.error('Failed to clear cache by pattern:', error)
    }
  }

  private clearOldestEntries(count: number): void {
    try {
      const entries: Array<{ key: string; timestamp: number }> = []
      const keys = Object.keys(localStorage)
      
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          const item = localStorage.getItem(key)
          if (item) {
            try {
              const entry: CacheEntry<unknown> = JSON.parse(item)
              entries.push({ key, timestamp: entry.timestamp })
            } catch {
              // Ignore parse errors
            }
          }
        }
      })

      entries.sort((a, b) => a.timestamp - b.timestamp)
      const toRemove = entries.slice(0, count)
      toRemove.forEach(({ key }) => localStorage.removeItem(key))
      this.updateSizeStats()
    } catch (error) {
      console.error('Failed to clear oldest entries:', error)
    }
  }

  private updateSizeStats(): void {
    try {
      const keys = Object.keys(localStorage)
      let size = 0
      let oldestTimestamp: number | null = null

      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          size++
          const item = localStorage.getItem(key)
          if (item) {
            try {
              const entry: CacheEntry<unknown> = JSON.parse(item)
              if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      })

      this.stats.size = size
      this.stats.oldestEntry = oldestTimestamp
      this.saveStats()
    } catch {
      // Ignore stats update errors
    }
  }

  public getStats(): Readonly<CacheStats> {
    return { ...this.stats }
  }

  public getHitRate(): number {
    const total = this.stats.hits + this.stats.misses
    return total === 0 ? 0 : this.stats.hits / total
  }

  public has(key: string): boolean {
    return this.get(key) !== null
  }

  public getRemainingTTL(key: string): number | null {
    try {
      const item = localStorage.getItem(this.getKey(key))
      if (!item) return null

      const entry: CacheEntry<unknown> = JSON.parse(item)
      const remaining = (entry.timestamp + entry.ttl) - Date.now()
      return remaining > 0 ? remaining : null
    } catch {
      return null
    }
  }

  public touch(key: string, additionalTTL?: number): boolean {
    try {
      const item = localStorage.getItem(this.getKey(key))
      if (!item) return false

      const entry: CacheEntry<unknown> = JSON.parse(item)
      entry.timestamp = Date.now()
      if (additionalTTL !== undefined) {
        entry.ttl = additionalTTL
      }
      localStorage.setItem(this.getKey(key), JSON.stringify(entry))
      return true
    } catch {
      return false
    }
  }
}

export const cacheService = CacheService.getInstance()
