# OasisBio Desktop App - Testing Guide

## Running Tests

### All Tests
```bash
# From workspace root
pnpm test

# From apps/desktop
pnpm test
```

### Watch Mode
```bash
pnpm test:watch
```

### Coverage Report
```bash
pnpm test:coverage
```

## Test Structure

### Unit Tests
- **Location**: `__tests__/` directories or alongside components
- **Coverage Target**: 70%+ (shared packages 80%+)
- **Tools**: Jest + React Testing Library

### Integration Tests
- **Purpose**: Test complete user flows
- **Tools**: (to be implemented)
- **Coverage Target**: 50%+

## Writing Tests

### Component Tests
```typescript
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click Me</Button>)
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('handles clicks', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### Hook Tests
```typescript
import { renderHook, act } from '@testing-library/react'
import { useAssistant } from '../useAssistant'

describe('useAssistant', () => {
  it('manages chat state', () => {
    const { result } = renderHook(() => useAssistant())
    expect(result.current.messages).toEqual([])
  })
})
```

### Utility Tests
```typescript
import { calculateCompletionScore } from '@oasisbio/common-core'

describe('calculateCompletionScore', () => {
  it('returns correct score', () => {
    const result = calculateCompletionScore({ title: 'Test' })
    expect(result.score).toBeGreaterThan(0)
  })
})
```

## Best Practices

1. **Test behavior, not implementation**
2. **Use user-centric queries**: `getByRole`, `getByText`, etc.
3. **Test error conditions**
4. **Mock external dependencies**
5. **Keep tests fast and focused**
6. **Follow AAA pattern**: Arrange, Act, Assert
