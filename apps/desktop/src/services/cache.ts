interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const CACHE_KEY_PREFIX = 'oasisbio-cache-'
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

export class CacheService {
  private static instance: CacheService

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  private getKey(key: string): string {
    return `${CACHE_KEY_PREFIX}${key}`
  }

  public get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key))
      if (!item) return null

      const entry: CacheEntry<T> = JSON.parse(item)
      const now = Date.now()

      if (now > entry.timestamp + entry.ttl) {
        this.delete(key)
        return null
      }

      return entry.data
    } catch {
      return null
    }
  }

  public set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl
      }
      localStorage.setItem(this.getKey(key), JSON.stringify(entry))
    } catch (error) {
      console.error('Failed to set cache:', error)
    }
  }

  public delete(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key))
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
    } catch (error) {
      console.error('Failed to clear cache:', error)
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
              const entry: CacheEntry<any> = JSON.parse(item)
              if (now > entry.timestamp + entry.ttl) {
                localStorage.removeItem(key)
              }
            } catch {
              localStorage.removeItem(key)
            }
          }
        }
      })
    } catch (error) {
      console.error('Failed to clear expired cache:', error)
    }
  }
}

export const cacheService = CacheService.getInstance()
