# Contributing to OasisBio Ecosystem

Thank you for your interest in contributing to OasisBio Ecosystem! This document provides guidelines and instructions for contributing.

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

#### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/zbbsdsb/OasisBio-Ecosystem.git
cd OasisBio-Ecosystem

# Install dependencies
pnpm install

# Create a feature branch
git checkout -b feature/your-feature-name
```

#### Code Standards

- **TypeScript**: Use strict mode, avoid `any`
- **Naming**: Use camelCase for variables/functions, PascalCase for types/classes
- **Imports**: Group imports: external → internal → relative
- **Testing**: Add tests for new functionality

```typescript
// Good
import { z } from 'zod';
import { ok, err } from '@oasisbio/common-core';
import { slugify } from './string';

interface UserProfile {
  id: string;
  name: string;
}

// Bad
import { slugify } from './string';
import { z } from 'zod';
import { ok, err } from '@oasisbio/common-core';
```

#### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(core): add Result type utilities
fix(utils): handle null values in date formatter
docs(validators): add examples for file validation
test(auth): add tests for OTP error handling
refactor(api): simplify endpoint type definitions
```

#### Submitting Changes

1. **Run tests**: `pnpm test`
2. **Run build**: `pnpm build`
3. **Run typecheck**: `pnpm typecheck`
4. **Push to your fork**
5. **Open a Pull Request**
6. **Wait for review** (we aim to respond within 48 hours)

---

## 📦 Package-Specific Guidelines

### Adding a New Package

1. Create directory: `packages/<package-name>/`
2. Add to `pnpm-workspace.yaml`
3. Create `package.json` with proper configuration
4. Add TypeScript config
5. Create `src/index.ts` with public exports
6. Add tests in `src/**/*.test.ts`

### Modifying Existing Packages

1. **common-core**: Be careful with breaking changes
2. **common-utils**: Keep utilities pure (no side effects)
3. **common-validators**: Maintain backward compatibility
4. **common-auth**: Security-sensitive, thorough review required

---

## 🧪 Testing Guidelines

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

### Writing Tests

```typescript
// packages/common-utils/src/string.test.ts
import { describe, it, expect } from 'vitest';
import { slugify } from './string';

describe('slugify', () => {
  it('should convert spaces to hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should handle special characters', () => {
    expect(slugify('Hello! @World#')).toBe('hello-world');
  });
});
```

---

## 📝 Documentation

- Update `README.md` for user-facing changes
- Add JSDoc comments for public APIs
- Update TypeScript types and interfaces
- Include code examples for new features

---

## 🔍 Code Review Process

1. Automated checks must pass (CI/CD)
2. At least one maintainer review required
3. Address review feedback
4. Maintain clean commit history

---

## 💬 Community

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

<p align="center">
  <strong>🏢 Oasis Company</strong><br>
  <a href="https://github.com/zbbsdsb">GitHub Organization</a>
</p>
