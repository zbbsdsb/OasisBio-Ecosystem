# Error Handling Guide - OasisBio Desktop App

## Overview

The app uses a consistent error handling approach:

- ErrorBoundary for component errors
- Toast notifications for user feedback
- Custom error class (OasisBioError)
- Automatic retries for transient errors

## Error Types

```typescript
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TIMEOUT: 'TIMEOUT',
}
```

## Usage

### Showing a Toast
```typescript
import { useToast } from './components/ui/Toast'

const Component = () => {
  const { showToast } = useToast()
  
  const handleAction = () => {
    try {
      // ...
      showToast('Success!', 'success')
    } catch (error) {
      showToast(formatError(error), 'error')
    }
  }
}
```

### Creating an Error
```typescript
import { createError, OasisBioError } from './utils/errors'

throw createError('Something went wrong', 'INTERNAL_ERROR', 500)
```

### Retryable Operations
```typescript
import { createRetryHandler } from './utils/errors'

const fetchData = createRetryHandler(
  async () => api.getData(),
  3, // max retries
  1000 // delay ms
)

await fetchData() // will retry on network errors/timeout
```

## Error Boundary

Root-level ErrorBoundary catches unhandled errors:

```jsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Best Practices

1. Always handle errors at the appropriate level
2. Provide clear, actionable error messages
3. Log errors for debugging
4. Differentiate between retryable and non-retryable errors
5. Don't expose sensitive details in error messages
