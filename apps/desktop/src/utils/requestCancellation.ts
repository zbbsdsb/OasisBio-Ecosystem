import { useEffect, useRef, useCallback } from 'react'

interface CancellableRequest<T> {
  abortController: AbortController
  promise: Promise<T>
}

export class RequestCancellationManager {
  private activeRequests: Map<string, AbortController> = new Map()

  createController(key: string): AbortController {
    const existingController = this.activeRequests.get(key)
    if (existingController) {
      existingController.abort()
    }

    const controller = new AbortController()
    this.activeRequests.set(key, controller)
    return controller
  }

  abort(key: string): void {
    const controller = this.activeRequests.get(key)
    if (controller) {
      controller.abort()
      this.activeRequests.delete(key)
    }
  }

  abortAll(): void {
    for (const controller of this.activeRequests.values()) {
      controller.abort()
    }
    this.activeRequests.clear()
  }

  abortByPattern(pattern: RegExp): void {
    for (const [key, controller] of this.activeRequests.entries()) {
      if (pattern.test(key)) {
        controller.abort()
        this.activeRequests.delete(key)
      }
    }
  }

  remove(key: string): void {
    this.activeRequests.delete(key)
  }

  hasActive(key: string): boolean {
    return this.activeRequests.has(key)
  }

  getActiveCount(): number {
    return this.activeRequests.size
  }

  async fetchWithCancellation<T>(
    key: string,
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = this.createController(key)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      this.remove(key)
      return data
    } catch (error) {
      this.remove(key)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new CancelledError(key)
      }
      throw error
    }
  }

  wrapPromise<T>(key: string, promiseFactory: (signal: AbortSignal) => Promise<T>): CancellableRequest<T> {
    const controller = this.createController(key)

    const promise = promiseFactory(controller.signal)
      .then((result) => {
        this.remove(key)
        return result
      })
      .catch((error) => {
        this.remove(key)
        throw error
      })

    return {
      abortController: controller,
      promise
    }
  }
}

export class CancelledError extends Error {
  constructor(public readonly requestKey: string) {
    super(`Request "${requestKey}" was cancelled`)
    this.name = 'CancelledError'
  }
}

export function isCancelledError(error: unknown): error is CancelledError {
  return error instanceof CancelledError
}

export const globalCancellationManager = new RequestCancellationManager()

export interface UseAbortControllerOptions {
  autoAbortOnUnmount?: boolean
}

export function useAbortController(options: UseAbortControllerOptions = {}) {
  const { autoAbortOnUnmount = true } = options
  const controllerRef = useRef<AbortController | null>(null)
  const managerRef = useRef<RequestCancellationManager | null>(null)

  if (!managerRef.current) {
    managerRef.current = new RequestCancellationManager()
  }

  const getController = useCallback((key?: string): AbortController => {
    if (key) {
      return managerRef.current!.createController(key)
    }

    if (!controllerRef.current || controllerRef.current.signal.aborted) {
      controllerRef.current = new AbortController()
    }
    return controllerRef.current
  }, [])

  const abort = useCallback((key?: string): void => {
    if (key) {
      managerRef.current!.abort(key)
    } else if (controllerRef.current) {
      controllerRef.current.abort()
    }
  }, [])

  const abortAll = useCallback((): void => {
    managerRef.current!.abortAll()
    if (controllerRef.current) {
      controllerRef.current.abort()
    }
  }, [])

  const getSignal = useCallback((key?: string): AbortSignal => {
    return getController(key).signal
  }, [getController])

  useEffect(() => {
    return () => {
      if (autoAbortOnUnmount) {
        abortAll()
      }
    }
  }, [autoAbortOnUnmount, abortAll])

  return {
    getController,
    getSignal,
    abort,
    abortAll,
    manager: managerRef.current
  }
}

export function useCancellableFetch() {
  const { getSignal, abort, abortAll, manager } = useAbortController()

  const fetch = useCallback(async <T>(
    key: string,
    url: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const signal = getSignal(key)

    try {
      const response = await globalThis.fetch(url, {
        ...options,
        signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      manager.remove(key)
      return data
    } catch (error) {
      manager.remove(key)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new CancelledError(key)
      }
      throw error
    }
  }, [getSignal, manager])

  return {
    fetch,
    abort,
    abortAll
  }
}
