# Contributing to OasisBio Ecosystem

Thank you for your interest in contributing to OasisBio Ecosystem! This document provides comprehensive guidelines and instructions for contributing.

---

## Table of Contents

- [How Can I Contribute?](#-how-can-i-contribute)
- [Development Environment Setup](#-development-environment-setup)
- [Code Style Guidelines](#-code-style-guidelines)
- [Commit Message Convention](#-commit-message-convention)
- [Pull Request Process](#-pull-request-process)
- [Testing Requirements](#-testing-requirements)
- [Package-Specific Guidelines](#-package-specific-guidelines)

---

## 🎯 How Can I Contribute?

### Reporting Bugs

Before creating a bug report:
1. **Search existing issues** to avoid duplicates
2. **Check if the issue is already resolved** in newer versions

When filing a bug report, include:
- **Clear title** and description
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (Node.js version, pnpm version, OS)
- **Code samples** or minimal reproduction case

### Suggesting Features

We welcome feature suggestions! Please:
1. **Search existing issues** first
2. **Describe the problem** you're trying to solve
3. **Explain the proposed solution**
4. **Consider alternatives** you've tried

### Pull Requests

We actively welcome pull requests! Follow the guidelines below for a smooth review process.

---

## 🛠️ Development Environment Setup

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (required for monorepo)
- **Git**
- **IDE**: VS Code recommended (with ESLint, Prettier extensions)

### Initial Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/OasisBio-Ecosystem.git
cd OasisBio-Ecosystem

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Create a feature branch
git checkout -b feature/your-feature-name
```

### Verify Setup

```bash
# Run tests
pnpm test

# Run linting
pnpm lint

# Run type checking (if available)
pnpm typecheck
```

---

## 📝 Code Style Guidelines

### TypeScript Standards

- **Strict mode**: TypeScript strict mode is enabled
- **No `any`**: Avoid `any` type; use `unknown` when type is truly unknown
- **Explicit types**: Always define types for function parameters and return values
- **Interfaces over types**: Prefer `interface` for object shapes, `type` for unions

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName` |
| Functions | camelCase | `getUserById()` |
| Classes | PascalCase | `UserService` |
| Interfaces | PascalCase | `IUser` or `User` |
| Types | PascalCase | `UserStatus` |
| Enums | PascalCase | `IdentityMode` |
| Constants | SCREAMING_SNAKE_CASE | `API_ENDPOINTS` |
| Files | kebab-case | `user-service.ts` |

### Import Organization

Group imports in this order:
1. External packages (React, Zod, etc.)
2. Internal packages (`@oasisbio/*`)
3. Relative imports

```typescript
// Good
import { useState, useEffect } from 'react';
import { z } from 'zod';

import { ok, err, type Result } from '@oasisbio/common-core';
import { slugify } from '@oasisbio/common-utils';

import { UserService } from './user-service';
import { validateUser } from '../validators';

// Bad (wrong order)
import { slugify } from '@oasisbio/common-utils';
import { useState } from 'react';
import { UserService } from './user-service';
import { z } from 'zod';
```

### Code Formatting

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Trailing commas**: ES5 compatible (objects, arrays)
- **Max line length**: 100 characters

### Best Practices

```typescript
// Good: Pure function, no side effects
export function formatUserName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}

// Good: Error handling with Result type
export async function fetchUser(id: string): Promise<Result<User, ApiError>> {
  try {
    const response = await api.get(`/users/${id}`);
    return ok(response.data);
  } catch (error) {
    return err(createApiError(error));
  }
}

// Good: Explicit return type
export function calculateScore(data: ScoreData): number {
  return data.points * data.multiplier;
}

// Bad: Implicit any
export function process(data) {  // ❌ Missing types
  return data.value;
}

// Bad: Side effects in utility
let counter = 0;
export function increment() {  // ❌ Side effect
  counter++;
}
```

---

## 📋 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, semicolons) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or modifying tests |
| `chore` | Build process, dependencies, tooling |
| `ci` | CI/CD configuration |

### Scopes

| Scope | Package/Area |
|-------|--------------|
| `core` | @oasisbio/common-core |
| `utils` | @oasisbio/common-utils |
| `auth` | @oasisbio/common-auth |
| `api` | @oasisbio/common-api |
| `validators` | @oasisbio/common-validators |
| `services` | @oasisbio/common-services |
| `desktop` | apps/desktop |
| `android` | apps/android |
| `flutter` | apps/flutter |

### Examples

```bash
# Feature
feat(core): add WorldItem completion score calculation

# Bug fix
fix(auth): handle OTP expiration correctly

# Documentation
docs(api): add OAuth endpoint documentation

# Refactoring
refactor(utils): simplify slugify implementation

# Test
test(validators): add tests for file validation

# Breaking change
feat(api)!: change OasisBio response format

BREAKING CHANGE: The OasisBio response now includes nested relations
```

---

## 🔄 Pull Request Process

### Before Submitting

1. **Sync with main**:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all checks**:
   ```bash
   pnpm test
   pnpm lint
   pnpm build
   ```

3. **Update documentation** if needed

4. **Add tests** for new functionality

### PR Requirements

- **Title**: Follow commit message convention
- **Description**: Explain what and why (not how)
- **Tests**: All tests must pass
- **Coverage**: Maintain or improve coverage
- **Breaking changes**: Clearly documented

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. Automated checks must pass (CI/CD)
2. At least one maintainer review required
3. Address all review feedback
4. Maintain clean commit history (squash if needed)

### After Merge

- Delete your feature branch
- Update your fork's main branch

---

## 🧪 Testing Requirements

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests for specific package
pnpm --filter @oasisbio/common-core test
```

### Coverage Requirements

| Package Type | Minimum Coverage |
|--------------|------------------|
| Shared packages | 80% |
| Desktop app | 70% |
| Integration tests | 50% |

### Writing Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { slugify } from './string';

describe('slugify', () => {
  it('should convert spaces to hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should handle special characters', () => {
    expect(slugify('Hello! @World#')).toBe('hello-world');
  });

  it('should handle empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle unicode characters', () => {
    expect(slugify('你好世界')).toBe('');
  });
});
```

### Writing Component Tests (React)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('handles clicks', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Writing Hook Tests

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAssistant } from '../useAssistant';

describe('useAssistant', () => {
  it('initializes with empty messages', () => {
    const { result } = renderHook(() => useAssistant());
    expect(result.current.messages).toEqual([]);
  });

  it('adds messages correctly', () => {
    const { result } = renderHook(() => useAssistant());
    
    act(() => {
      result.current.addMessage('user', 'Hello');
    });
    
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hello');
  });
});
```

### Test Best Practices

1. **Test behavior, not implementation**
2. **Use user-centric queries**: `getByRole`, `getByText`, etc.
3. **Test error conditions** and edge cases
4. **Mock external dependencies**
5. **Keep tests fast and focused**
6. **Follow AAA pattern**: Arrange, Act, Assert

---

## 📦 Package-Specific Guidelines

### Adding a New Package

1. Create directory: `packages/<package-name>/`
2. Add to `pnpm-workspace.yaml`
3. Create `package.json`:
   ```json
   {
     "name": "@oasisbio/<package-name>",
     "version": "0.1.0",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "scripts": {
       "build": "tsup",
       "test": "vitest"
     }
   }
   ```
4. Add TypeScript config
5. Create `src/index.ts` with public exports
6. Add tests in `src/**/*.test.ts`
7. Run `pnpm install`

### Modifying Existing Packages

#### common-core
- **Be careful with breaking changes** - affects all packages
- Keep models in sync with Prisma schema
- Document all exported types

#### common-utils
- **Keep utilities pure** - no side effects
- Handle edge cases gracefully
- Add comprehensive tests

#### common-auth
- **Security-sensitive** - thorough review required
- Never log sensitive data
- Follow OWASP guidelines

#### common-validators
- **Maintain backward compatibility**
- Use Zod for schema validation
- Provide clear error messages

#### common-api
- Keep endpoints in sync with backend
- Document all request/response types
- Handle all error codes

### Dependency Rules

```
common-core       → No package dependencies
common-utils      → common-core
common-auth       → common-core, common-utils
common-api        → common-core, common-auth
common-validators → common-core, common-utils
common-services   → all other packages
```

---

## 📚 Documentation

### When to Update Documentation

- New features → Update README and API docs
- Breaking changes → Update migration guide
- New packages → Add to package list
- API changes → Update api-reference.md

### JSDoc Comments

```typescript
/**
 * Calculates the completion score for a world.
 * 
 * @param world - The world item to score
 * @returns An object containing the total score and breakdown by module
 * 
 * @example
 * ```typescript
 * const result = calculateWorldCompletionScore(world);
 * console.log(result.score); // 75
 * console.log(result.breakdown.coreIdentity); // 100
 * ```
 */
export function calculateWorldCompletionScore(
  world: Partial<WorldItem>
): CompletionScoreResult {
  // ...
}
```

---

## 💬 Community

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Pull Requests**: Code contributions

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

<p align="center">
  <strong>🏢 Oasis Company</strong><br>
  <a href="https://github.com/zbbsdsb">GitHub Organization</a>
</p>
