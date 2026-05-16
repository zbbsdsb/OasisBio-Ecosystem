import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const CACHE_KEY_PREFIX = 'oasisbio-cache-'
const CACHE_VERSION_KEY = 'oasisbio-cache-version'
const CACHE_STATS_KEY = 'oasisbio-cache-stats'

describe('CacheService', () => {
  let CacheService: typeof import('./cache').CacheService
  let cacheService: import('./cache').CacheService

  beforeEach(async () => {
    localStorage.clear()
    vi.resetModules()
    const module = await import('./cache')
    CacheService = module.CacheService
    cacheService = module.cacheService
  })

  afterEach(() => {
    cacheService.stopCleanupInterval()
    localStorage.clear()
  })

  it('should set and get data', () => {
    cacheService.set('test-key', { data: 'test' })
    const result = cacheService.get<{ data: string }>('test-key')
    expect(result).toEqual({ data: 'test' })
  })

  it('should return null for non-existent key', () => {
    const result = cacheService.get('non-existent')
    expect(result).toBeNull()
  })

  it('should delete data', () => {
    cacheService.set('test-key', { data: 'test' })
    cacheService.delete('test-key')
    const result = cacheService.get('test-key')
    expect(result).toBeNull()
  })

  it('should clear all cache', () => {
    cacheService.set('key1', 'data1')
    cacheService.set('key2', 'data2')
    cacheService.clear()
    expect(cacheService.get('key1')).toBeNull()
    expect(cacheService.get('key2')).toBeNull()
  })

  it('should respect TTL', async () => {
    cacheService.set('test-key', { data: 'test' }, { ttl: 100 })
    expect(cacheService.get('test-key')).toEqual({ data: 'test' })

    await new Promise(resolve => setTimeout(resolve, 150))
    expect(cacheService.get('test-key')).toBeNull()
  })

  it('should track cache stats', () => {
    cacheService.set('test-key', { data: 'test' })
    cacheService.get('test-key')
    cacheService.get('non-existent')

    const stats = cacheService.getStats()
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
  })

  it('should calculate hit rate', () => {
    cacheService.set('test-key', { data: 'test' })
    cacheService.get('test-key')
    cacheService.get('non-existent')

    expect(cacheService.getHitRate()).toBe(0.5)
  })

  it('should clear by tag', () => {
    cacheService.set('key1', 'data1', { tags: ['user'] })
    cacheService.set('key2', 'data2', { tags: ['user'] })
    cacheService.set('key3', 'data3', { tags: ['post'] })

    cacheService.clearByTag('user')

    expect(cacheService.get('key1')).toBeNull()
    expect(cacheService.get('key2')).toBeNull()
    expect(cacheService.get('key3')).toBe('data3')
  })

  it('should clear by pattern', () => {
    cacheService.set('user-1', 'data1')
    cacheService.set('user-2', 'data2')
    cacheService.set('post-1', 'data3')

    cacheService.clearByPattern(/^user-/)

    expect(cacheService.get('user-1')).toBeNull()
    expect(cacheService.get('user-2')).toBeNull()
    expect(cacheService.get('post-1')).toBe('data3')
  })

  it('should check if key exists', () => {
    cacheService.set('test-key', 'data')
    expect(cacheService.has('test-key')).toBe(true)
    expect(cacheService.has('non-existent')).toBe(false)
  })

  it('should get remaining TTL', () => {
    cacheService.set('test-key', 'data', { ttl: 10000 })
    const remaining = cacheService.getRemainingTTL('test-key')
    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThanOrEqual(10000)
  })

  it('should touch and extend TTL', () => {
    cacheService.set('test-key', 'data', { ttl: 100 })
    const success = cacheService.touch('test-key', 10000)
    expect(success).toBe(true)

    const remaining = cacheService.getRemainingTTL('test-key')
    expect(remaining).toBeGreaterThan(100)
  })

  it('should handle version mismatch', async () => {
    localStorage.setItem(CACHE_VERSION_KEY, '0.0.0')
    cacheService.set('test-key', 'data')

    vi.resetModules()
    const newModule = await import('./cache')
    const newCacheService = newModule.cacheService

    expect(newCacheService.get('test-key')).toBeNull()
    newCacheService.stopCleanupInterval()
  })
})
