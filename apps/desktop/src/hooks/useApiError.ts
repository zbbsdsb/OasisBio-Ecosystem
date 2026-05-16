import { useCallback } from 'react'
import { useToast } from '../components/ui/Toast'
import {
  OasisBioError,
  isOasisBioError,
  shouldRetry,
  ERROR_CODES,
  formatError
} from '../utils/errors'

interface UseApiErrorOptions {
  onUnauthorized?: () => void
  onNetworkError?: () => void
}

interface ApiErrorResult {
  error: OasisBioError | Error
  canRetry: boolean
  retry?: () => void
}

export function useApiError(options: UseApiErrorOptions = {}) {
  const { showToast } = useToast()

  const handleError = useCallback(<T,>(
    error: unknown,
    retryFn?: () => Promise<T>
  ): ApiErrorResult => {
    let oasisError: OasisBioError

    if (isOasisBioError(error)) {
      oasisError = error
    } else if (error instanceof Error) {
      oasisError = new OasisBioError(error.message, {
        code: ERROR_CODES.INTERNAL_ERROR,
        details: { originalError: error }
      })
    } else {
      oasisError = new OasisBioError('An unexpected error occurred', {
        code: ERROR_CODES.INTERNAL_ERROR,
        details: error
      })
    }

    const canRetry = shouldRetry(oasisError)

    if (oasisError.code === ERROR_CODES.UNAUTHORIZED) {
      options.onUnauthorized?.()
    }

    if (oasisError.code === ERROR_CODES.NETWORK_ERROR) {
      options.onNetworkError?.()
    }

    return {
      error: oasisError,
      canRetry,
      retry: retryFn && canRetry ? () => retryFn() : undefined
    }
  }, [options])

  const showErrorToast = useCallback((
    error: unknown,
    retryFn?: () => Promise<void>
  ) => {
    const result = handleError(error, retryFn)
    const message = formatError(result.error)

    if (result.canRetry && result.retry) {
      showToast(message, 'error', 10000, result.retry)
    } else {
      showToast(message, 'error', 5000)
    }

    return result
  }, [handleError, showToast])

  const wrapApiCall = useCallback(async <T,>(
    apiCall: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void
      onError?: (error: ApiErrorResult) => void
      successMessage?: string
      retryCount?: number
    }
  ): Promise<T | null> => {
    try {
      const result = await apiCall()
      options?.onSuccess?.(result)
      if (options?.successMessage) {
        showToast(options.successMessage, 'success')
      }
      return result
    } catch (error) {
      const result = handleError(error)
      showErrorToast(error)
      options?.onError?.(result)
      return null
    }
  }, [handleError, showErrorToast, showToast])

  return {
    handleError,
    showErrorToast,
    wrapApiCall,
    isOasisBioError,
    shouldRetry
  }
}

export function getErrorMessage(error: unknown): string {
  if (isOasisBioError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export function isRetryableError(error: unknown): boolean {
  return shouldRetry(error)
}
