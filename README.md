<div align="center">
  <h1>OasisBio Ecosystem</h1>
  <p><strong>Shared utilities and types powering the Oasis Company creative AI ecosystem</strong></p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  [![npm packages](https://img.shields.io/badge/npm_packages-7-green.svg)](https://www.npmjs.com/)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![oasis-company](https://img.shields.io/badge/oasis--company-ai--powered-orange.svg)](https://github.com/zbbsdsb)
</div>

---

## 🎯 What Is This?

OasisBio Ecosystem is a **monorepo of shared TypeScript packages** that power multiple Oasis Company products. Instead of duplicating code across projects, these packages provide:

- **Consistent types** across all products
- **Reusable utilities** (string manipulation, date formatting, validation)
- **Standardized authentication** patterns
- **Shared validation rules** for forms and APIs

This ecosystem is the **foundation layer** for:

| Product | Description | Link |
|---------|-------------|------|
| **MuseRock** | AI-powered creative collaboration platform | [GitHub](https://github.com/zbbsdsb/muserock) |
| **R U Socrates** | Transparent AI research engine | [GitHub](https://github.com/zbbsdsb/R-U-Socrates) |
| **QueueDesk** | AI-first internal service desk | [GitHub](https://github.com/zbbsdsb/QueueDesk) |
| **pwl-reading** | AI-native reading companion | [GitHub](https://github.com/zbbsdsb/pwl-reading-companion) |

---

## 📦 Available Packages

### Production Ready

| Package | Version | Description |
|---------|---------|-------------|
| `@oasisbio/common-core` | 1.0.0 | Core types, enums, constants, and models |
| `@oasisbio/common-utils` | 1.0.0 | String, date, URL, validation, crypto utilities |
| `@oasisbio/common-auth` | 1.0.0 | Authentication types and error definitions |
| `@oasisbio/common-api` | 1.0.0 | API client interfaces and endpoint definitions |
| `@oasisbio/common-validators` | 1.0.0 | Validation schemas for forms and APIs |
| `@oasisbio/common-services` | 1.0.0 | Shared business logic services |

### In Development

| Package | Version | Description |
|---------|---------|-------------|
| `@oasisbio/design-system` | WIP | UI component library and design tokens |
| `@oasisbio/identity-core` | WIP | Identity management and user profiles |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** 9+ (recommended) or npm/yarn

### Installation

```bash
# Clone the monorepo
git clone https://github.com/zbbsdsb/OasisBio-Ecosystem.git
cd OasisBio-Ecosystem

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Using Individual Packages

```bash
# Install a specific package
pnpm add @oasisbio/common-core
pnpm add @oasisbio/common-utils
pnpm add @oasisbio/common-validators
```

---

## 📚 Package Documentation

### @oasisbio/common-core

Core types, enums, constants, and Result utilities.

```typescript
import {
  // Types
  type OasisBio,
  type User,
  type Profile,
  // Enums
  IdentityMode,
  Visibility,
  NuwaStatus,
  // Constants
  API_ENDPOINTS,
  VALIDATION_RULES,
  // Result utilities
  ok,
  err,
  type Result
} from '@oasisbio/common-core';
```

### @oasisbio/common-utils

Utility functions for common operations.

```typescript
import {
  // String utilities
  slugify,
  truncate,
  validateEmail,
  // Date utilities
  formatDate,
  formatDateTime,
  relativeTime,
  // URL utilities
  buildUrl,
  // Validation utilities
  validateRequired,
  validateLength,
  // Result utilities
  tryCatch,
  tryCatchAsync,
  // Logger
  logger,
  // Crypto
  generateSecret
} from '@oasisbio/common-utils';
```

### @oasisbio/common-validators

Zod-based validation schemas.

```typescript
import {
  // OasisBio validators
  validateCreateOasisBio,
  validateUpdateOasisBio,
  // Profile validators
  validateUpdateProfile,
  validateRegister,
  // Auth validators
  validateLoginWithOtp,
  validateVerifyOtp,
  // File validators
  validateImageFile,
  validateDcosFile
} from '@oasisbio/common-validators';
```

### @oasisbio/common-auth

Authentication types and error definitions.

```typescript
import {
  // Types
  type AuthSession,
  type AuthState,
  // Errors
  AuthError,
  OtpError,
  // Constants
  AUTH_ROUTES,
  AUTH_ERROR_CODES,
  OTP_ERROR_CODES
} from '@oasisbio/common-auth';
```

---

## 🏗️ Project Structure

```
OasisBio-Ecosystem/
├── packages/
│   ├── common-core/           # Core types, enums, constants
│   │   ├── src/
│   │   │   ├── models/       # Domain models
│   │   │   ├── enums/        # Type enums
│   │   │   ├── constants/     # App constants
│   │   │   ├── types/         # TypeScript types
│   │   │   └── utils/         # Utility functions
│   │   └── package.json
│   ├── common-utils/          # Shared utilities
│   │   ├── src/
│   │   │   ├── string.ts
│   │   │   ├── date.ts
│   │   │   ├── url.ts
│   │   │   ├── validation.ts
│   │   │   ├── result.ts
│   │   │   ├── logger.ts
│   │   │   └── crypto.ts
│   │   └── package.json
│   ├── common-auth/           # Auth types & errors
│   ├── common-api/            # API interfaces
│   ├── common-validators/     # Zod validation schemas
│   ├── common-services/       # Shared services
│   ├── design-system/         # UI components (WIP)
│   └── identity-core/         # Identity mgmt (WIP)
├── apps/                      # Applications (future)
├── pnpm-workspace.yaml        # Workspace config
└── package.json               # Root package.json
```

---

## 🛠️ Development

### Available Scripts

```bash
# Build all packages
pnpm build

# Build in watch mode
pnpm dev

# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Test all packages
pnpm test

# Clean build artifacts
pnpm clean
```

### Adding a New Package

1. Create package under `packages/<package-name>/`
2. Add to `pnpm-workspace.yaml`
3. Create `package.json` with proper TypeScript config
4. Run `pnpm install` to update lockfile

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/OasisBio-Ecosystem.git`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Make your changes** following the code style
5. **Test** your changes: `pnpm test`
6. **Build**: `pnpm build`
7. **Commit**: `git commit -m "feat: add feature description"`
8. **Push**: `git push origin feature/your-feature-name`
9. **Open a Pull Request**

### Code Standards

- **Language**: TypeScript (strict mode)
- **Styling**: ESLint + Prettier
- **Commits**: Conventional Commits format
- **Testing**: Jest for unit tests

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>🏢 Oasis Company</strong><br>
  <a href="https://github.com/zbbsdsb">GitHub Organization</a>
</p>

<p align="center">
  Explore our ecosystem:
  <a href="https://github.com/zbbsdsb/QueueDesk">QueueDesk</a> ·
  <a href="https://github.com/zbbsdsb/muserock">MuseRock</a> ·
  <a href="https://github.com/zbbsdsb/R-U-Socrates">R U Socrates</a> ·
  <a href="https://github.com/zbbsdsb/pwl-reading-companion">pwl-reading</a>
</p>
