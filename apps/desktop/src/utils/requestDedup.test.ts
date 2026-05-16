import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RequestDeduplicator, globalDeduplicator, createDedupeKey, createApiRequestKey } from './requestDedup'

describe('RequestDeduplicator', () => {
  let deduplicator: RequestDeduplicator

  beforeEach(() => {
    deduplicator = new RequestDeduplicator()
  })

  it('should dedupe identical requests', async () => {
    let callCount = 0
    const fetcher = async () => {
      callCount++
      return { data: 'test' }
    }

    const promise1 = deduplicator.dedupe('key1', fetcher)
    const promise2 = deduplicator.dedupe('key1', fetcher)

    const [result1, result2] = await Promise.all([promise1, promise2])

    expect(result1).toEqual({ data: 'test' })
    expect(result2).toEqual({ data: 'test' })
    expect(callCount).toBe(1)
  })

  it('should not dedupe different requests', async () => {
    let callCount = 0
    const fetcher = async () => {
      callCount++
      return { data: 'test' }
    }

    const promise1 = deduplicator.dedupe('key1', fetcher)
    const promise2 = deduplicator.dedupe('key2', fetcher)

    await Promise.all([promise1, promise2])

    expect(callCount).toBe(2)
  })

  it('should allow new request after previous completes', async () => {
    let callCount = 0
    const fetcher = async () => {
      callCount++
      return { data: 'test' }
    }

    await deduplicator.dedupe('key1', fetcher)
    await deduplicator.dedupe('key1', fetcher)

    expect(callCount).toBe(2)
  })

  it('should clear all pending requests', () => {
    deduplicator.dedupe('key1', () => new Promise(() => {}))
    deduplicator.dedupe('key2', () => new Promise(() => {}))

    expect(deduplicator.getPendingCount()).toBe(2)

    deduplicator.clear()

    expect(deduplicator.getPendingCount()).toBe(0)
  })

  it('should clear by pattern', () => {
    deduplicator.dedupe('api:users', () => new Promise(() => {}))
    deduplicator.dedupe('api:posts', () => new Promise(() => {}))
    deduplicator.dedupe('cache:data', () => new Promise(() => {}))

    deduplicator.clearByPattern(/^api:/)

    expect(deduplicator.hasPending('api:users')).toBe(false)
    expect(deduplicator.hasPending('api:posts')).toBe(false)
    expect(deduplicator.hasPending('cache:data')).toBe(true)
  })

  it('should handle errors correctly', async () => {
    const fetcher = async () => {
      throw new Error('Fetch failed')
    }

    await expect(deduplicator.dedupe('key1', fetcher)).rejects.toThrow('Fetch failed')
    expect(deduplicator.hasPending('key1')).toBe(false)
  })
})

describe('createDedupeKey', () => {
  it('should create key from parts', () => {
    expect(createDedupeKey('users', 123, 'profile')).toBe('users:123:profile')
  })

  it('should filter out undefined and null', () => {
    expect(createDedupeKey('users', undefined, null, 'data')).toBe('users:data')
  })
})

describe('createApiRequestKey', () => {
  it('should create key for GET request', () => {
    const key = createApiRequestKey('GET', '/api/users')
    expect(key).toBe('GET:/api/users:')
  })

  it('should include body hash for POST request', () => {
    const key = createApiRequestKey('POST', '/api/users', { name: 'test' })
    expect(key).toBe('POST:/api/users:{"name":"test"}')
  })
})

describe('globalDeduplicator', () => {
  it('should be a singleton instance', () => {
    expect(globalDeduplicator).toBeInstanceOf(RequestDeduplicator)
  })
})
