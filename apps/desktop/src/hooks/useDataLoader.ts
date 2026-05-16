import { useState, useEffect, useCallback, useRef } from 'react'
import { cacheService } from '../services/cache'
import { offlineService } from '../services/offlineService'
import { globalDeduplicator } from '../utils/requestDedup'
import { isCancelledError, CancelledError } from '../utils/requestCancellation'
import { useAbortController } from '../utils/requestCancellation'

export interface DataLoaderState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  isStale: boolean
  isOffline: boolean
}

export interface DataLoaderOptions<T> {
  cacheKey?: string
  cacheTTL?: number
  cacheTags?: string[]
  enabled?: boolean
  dedupe?: boolean
  retryCount?: number
  retryDelay?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  onOffline?: () => T | null
  initialData?: T
  refetchInterval?: number
  refetchOnWindowFocus?: boolean
  staleTime?: number
}

export function useDataLoader<T>(
  fetcher: () => Promise<T>,
  options: DataLoaderOptions<T> = {}
): DataLoaderState<T> & {
  refetch: () => Promise<void>
  setData: (data: T) => void
  clearCache: () => void
} {
  const {
    cacheKey,
    cacheTTL,
    cacheTags,
    enabled = true,
    dedupe = true,
    retryCount = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
    onOffline,
    initialData = null,
    refetchInterval,
    refetchOnWindowFocus = true,
    staleTime = 0
  } = options

  const [state, setState] = useState<DataLoaderState<T>>({
    data: initialData,
    loading: enabled && initialData === null,
    error: null,
    isStale: false,
    isOffline: !offlineService.getOnlineStatus()
  })

  const { getSignal, abort } = useAbortController()
  const lastFetchTime = useRef<number>(0)
  const retryAttempt = useRef<number>(0)
  const mounted = useRef<boolean>(true)

  const fetchData = useCallback(async (isRefetch = false): Promise<void> => {
    if (!enabled) return

    const now = Date.now()
    if (!isRefetch && staleTime > 0 && now - lastFetchTime.current < staleTime) {
      return
    }

    if (cacheKey && !isRefetch) {
      const cached = cacheService.get<T>(cacheKey)
      if (cached) {
        setState(prev => ({
          ...prev,
          data: cached,
          loading: false,
          error: null,
          isStale: false
        }))
        lastFetchTime.current = now
        return
      }
    }

    if (!offlineService.getOnlineStatus()) {
      if (onOffline) {
        const offlineData = onOffline()
        if (offlineData) {
          setState(prev => ({
            ...prev,
            data: offlineData,
            loading: false,
            error: null,
            isOffline: true
          }))
          return
        }
      }
      
      if (cacheKey) {
        const cached = cacheService.get<T>(cacheKey)
        if (cached) {
          setState(prev => ({
            ...prev,
            data: cached,
            loading: false,
            error: null,
            isOffline: true
          }))
          return
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: new Error('No data available offline'),
        isOffline: true
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null, isOffline: false }))

    const signal = getSignal(cacheKey || `data-loader-${Date.now()}`)

    const executeFetch = async (): Promise<T> => {
      if (dedupe && cacheKey) {
        return globalDeduplicator.dedupe(cacheKey, fetcher)
      }
      return fetcher()
    }

    try {
      const data = await executeFetch()
      
      if (!mounted.current) return

      if (cacheKey) {
        cacheService.set(cacheKey, data, { ttl: cacheTTL, tags: cacheTags })
      }

      setState(prev => ({
        ...prev,
        data,
        loading: false,
        error: null,
        isStale: false,
        isOffline: false
      }))
      lastFetchTime.current = Date.now()
      retryAttempt.current = 0
      onSuccess?.(data)
    } catch (error) {
      if (!mounted.current) return

      if (isCancelledError(error)) {
        return
      }

      if (retryAttempt.current < retryCount) {
        retryAttempt.current++
        setTimeout(() => fetchData(isRefetch), retryDelay * retryAttempt.current)
        return
      }

      const err = error instanceof Error ? error : new Error(String(error))
      setState(prev => ({
        ...prev,
        loading: false,
        error: err,
        isOffline: !offlineService.getOnlineStatus()
      }))
      onError?.(err)
    }
  }, [
    enabled,
    cacheKey,
    cacheTTL,
    cacheTags,
    dedupe,
    retryCount,
    retryDelay,
    fetcher,
    onSuccess,
    onError,
    onOffline,
    staleTime,
    getSignal
  ])

  const refetch = useCallback(async (): Promise<void> => {
    abort()
    await fetchData(true)
  }, [fetchData, abort])

  const setData = useCallback((data: T): void => {
    setState(prev => ({ ...prev, data, isStale: false }))
    if (cacheKey) {
      cacheService.set(cacheKey, data, { ttl: cacheTTL, tags: cacheTags })
    }
  }, [cacheKey, cacheTTL, cacheTags])

  const clearCache = useCallback((): void => {
    if (cacheKey) {
      cacheService.delete(cacheKey)
    }
  }, [cacheKey])

  useEffect(() => {
    mounted.current = true
    fetchData()
    return () => {
      mounted.current = false
      abort()
    }
  }, [fetchData, abort])

  useEffect(() => {
    if (!refetchInterval) return

    const interval = setInterval(() => {
      setState(prev => ({ ...prev, isStale: true }))
      fetchData()
    }, refetchInterval)

    return () => clearInterval(interval)
  }, [refetchInterval, fetchData])

  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      setState(prev => ({ ...prev, isStale: true }))
      fetchData()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, fetchData])

  useEffect(() => {
    const unsubscribe = offlineService.subscribe((isOnline) => {
      setState(prev => ({ ...prev, isOffline: !isOnline }))
      if (isOnline) {
        fetchData()
      }
    })
    return unsubscribe
  }, [fetchData])

  return {
    ...state,
    refetch,
    setData,
    clearCache
  }
}

export interface UseOnlineStatusReturn {
  isOnline: boolean
  isOffline: boolean
  pendingActions: number
  sync: () => Promise<{ synced: number; failed: number }>
}

export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState(offlineService.getOnlineStatus())
  const [pendingActions, setPendingActions] = useState(offlineService.getQueueLength())

  useEffect(() => {
    const unsubscribeOnline = offlineService.subscribe((online) => {
      setIsOnline(online)
    })

    const checkPending = setInterval(() => {
      setPendingActions(offlineService.getQueueLength())
    }, 1000)

    return () => {
      unsubscribeOnline()
      clearInterval(checkPending)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
    pendingActions,
    sync: () => offlineService.syncOfflineActions()
  }
}

export interface UseCacheStatsReturn {
  hits: number
  misses: number
  size: number
  hitRate: number
}

export function useCacheStats(): UseCacheStatsReturn {
  const [stats, setStats] = useState(() => {
    const s = cacheService.getStats()
    return {
      hits: s.hits,
      misses: s.misses,
      size: s.size,
      hitRate: cacheService.getHitRate()
    }
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const s = cacheService.getStats()
      setStats({
        hits: s.hits,
        misses: s.misses,
        size: s.size,
        hitRate: cacheService.getHitRate()
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return stats
}
