import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RequestCancellationManager, CancelledError, isCancelledError, globalCancellationManager } from './requestCancellation'

describe('RequestCancellationManager', () => {
  let manager: RequestCancellationManager

  beforeEach(() => {
    manager = new RequestCancellationManager()
  })

  it('should create abort controller', () => {
    const controller = manager.createController('key1')
    expect(controller).toBeInstanceOf(AbortController)
    expect(controller.signal.aborted).toBe(false)
  })

  it('should abort existing controller when creating new one with same key', () => {
    const controller1 = manager.createController('key1')
    const controller2 = manager.createController('key1')

    expect(controller1.signal.aborted).toBe(true)
    expect(controller2.signal.aborted).toBe(false)
  })

  it('should abort specific request', () => {
    manager.createController('key1')
    manager.abort('key1')

    expect(manager.hasActive('key1')).toBe(false)
  })

  it('should abort all requests', () => {
    const controller1 = manager.createController('key1')
    const controller2 = manager.createController('key2')

    manager.abortAll()

    expect(controller1.signal.aborted).toBe(true)
    expect(controller2.signal.aborted).toBe(true)
    expect(manager.getActiveCount()).toBe(0)
  })

  it('should abort by pattern', () => {
    const controller1 = manager.createController('api:users')
    const controller2 = manager.createController('api:posts')
    const controller3 = manager.createController('cache:data')

    manager.abortByPattern(/^api:/)

    expect(controller1.signal.aborted).toBe(true)
    expect(controller2.signal.aborted).toBe(true)
    expect(controller3.signal.aborted).toBe(false)
  })

  it('should remove controller', () => {
    manager.createController('key1')
    manager.remove('key1')

    expect(manager.hasActive('key1')).toBe(false)
  })

  it('should track active count', () => {
    manager.createController('key1')
    manager.createController('key2')
    manager.createController('key3')

    expect(manager.getActiveCount()).toBe(3)

    manager.abort('key1')

    expect(manager.getActiveCount()).toBe(2)
  })
})

describe('CancelledError', () => {
  it('should create error with request key', () => {
    const error = new CancelledError('test-key')
    expect(error.message).toBe('Request "test-key" was cancelled')
    expect(error.name).toBe('CancelledError')
    expect(error.requestKey).toBe('test-key')
  })
})

describe('isCancelledError', () => {
  it('should return true for CancelledError', () => {
    const error = new CancelledError('test-key')
    expect(isCancelledError(error)).toBe(true)
  })

  it('should return false for other errors', () => {
    const error = new Error('test')
    expect(isCancelledError(error)).toBe(false)
  })
})

describe('globalCancellationManager', () => {
  it('should be a singleton instance', () => {
    expect(globalCancellationManager).toBeInstanceOf(RequestCancellationManager)
  })
})
