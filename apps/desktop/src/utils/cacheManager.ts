export interface CacheEntry<T> {
  key: string;
  value: T;
  size: number;
  createdAt: number;
  lastAccessedAt: number;
  expiresAt: number | null;
  accessCount: number;
}

export interface CacheConfig {
  maxSize: number;
  maxMemoryMB: number;
  defaultTTL: number;
  enablePressureDetection: boolean;
  pressureThreshold: number;
  cleanupInterval: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  memoryUsage: number;
  hitRate: number;
}

export interface MemoryPressureEvent {
  level: 'normal' | 'warning' | 'critical';
  memoryUsage: number;
  threshold: number;
  action: 'none' | 'evict_lru' | 'clear_all';
}

type MemoryPressureCallback = (event: MemoryPressureEvent) => void;

const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 1000,
  maxMemoryMB: 50,
  defaultTTL: 300000,
  enablePressureDetection: true,
  pressureThreshold: 0.8,
  cleanupInterval: 60000,
};

function estimateSize(value: any): number {
  try {
    return JSON.stringify(value).length * 2;
  } catch {
    return 1024;
  }
}

export class LRUCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer: number | null = null;
  private pressureListeners: MemoryPressureCallback[] = [];
  private memoryUsage: number = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      memoryUsage: 0,
      hitRate: 0,
    };
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    if (typeof window === 'undefined') return;

    this.cleanupTimer = window.setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private calculateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private checkMemoryPressure(): void {
    if (!this.config.enablePressureDetection) return;

    const maxMemoryBytes = this.config.maxMemoryMB * 1024 * 1024;
    const usageRatio = this.memoryUsage / maxMemoryBytes;

    if (usageRatio >= this.config.pressureThreshold) {
      const level: MemoryPressureEvent['level'] =
        usageRatio >= 0.95 ? 'critical' : 'warning';

      const event: MemoryPressureEvent = {
        level,
        memoryUsage: this.memoryUsage,
        threshold: maxMemoryBytes * this.config.pressureThreshold,
        action: level === 'critical' ? 'clear_all' : 'evict_lru',
      };

      if (level === 'critical') {
        this.clear();
      } else {
        this.evictLRU(Math.floor(this.cache.size * 0.2));
      }

      this.notifyPressure(event);
    }
  }

  private notifyPressure(event: MemoryPressureEvent): void {
    this.pressureListeners.forEach(callback => {
      try {
        callback(event);
      } catch (e) {
        console.error('Memory pressure callback error:', e);
      }
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.calculateHitRate();
      return undefined;
    }

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      this.calculateHitRate();
      return undefined;
    }

    entry.lastAccessedAt = Date.now();
    entry.accessCount++;
    this.stats.hits++;
    this.calculateHitRate();
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const size = estimateSize(value);
    const expiresAt = ttl !== undefined ? now + ttl : now + this.config.defaultTTL;

    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.memoryUsage -= existing.size;
      this.cache.delete(key);
    }

    while (
      this.cache.size >= this.config.maxSize ||
      this.memoryUsage + size > this.config.maxMemoryMB * 1024 * 1024
    ) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.delete(firstKey);
        this.stats.evictions++;
      } else {
        break;
      }
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      size,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt,
      accessCount: 0,
    };

    this.cache.set(key, entry);
    this.memoryUsage += size;
    this.stats.size = this.cache.size;
    this.stats.memoryUsage = this.memoryUsage;

    this.checkMemoryPressure();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.memoryUsage -= entry.size;
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      this.stats.memoryUsage = this.memoryUsage;
      return true;
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.memoryUsage = 0;
    this.stats.size = 0;
    this.stats.memoryUsage = 0;
  }

  private evictLRU(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt)
      .slice(0, count);

    entries.forEach(([key]) => {
      this.delete(key);
      this.stats.evictions++;
    });
  }

  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  values(): T[] {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  entries(): [string, T][] {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  onMemoryPressure(callback: MemoryPressureCallback): () => void {
    this.pressureListeners.push(callback);
    return () => {
      const index = this.pressureListeners.indexOf(callback);
      if (index > -1) this.pressureListeners.splice(index, 1);
    };
  }

  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  destroy(): void {
    if (this.cleanupTimer !== null) {
      window.clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
    this.pressureListeners = [];
  }
}

export const defaultCache = new LRUCache();

export function createCache<T = any>(config?: Partial<CacheConfig>): LRUCache<T> {
  return new LRUCache<T>(config);
}

export function withCache<K extends string[], T>(
  cache: LRUCache,
  keyBuilder: (...args: any[]) => K,
  ttl?: number
): MethodDecorator {
  return function (
    _target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value as Function;

    descriptor.value = function (...args: any[]) {
      const cacheKey = keyBuilder(...args).join(':');

      const cached = cache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      const result = original.apply(this, args);

      if (result && typeof result.then === 'function') {
        return result.then((value: T) => {
          cache.set(cacheKey, value, ttl);
          return value;
        });
      }

      cache.set(cacheKey, result, ttl);
      return result;
    };

    return descriptor;
  };
}
