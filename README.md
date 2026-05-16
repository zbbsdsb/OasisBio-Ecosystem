<div align="center">
  <h1>OasisBio Ecosystem</h1>
  <p><strong>Cross-era Digital Identity System - Shared utilities and types powering the Oasis Company creative AI ecosystem</strong></p>

  ![Social Preview](social-preview.html)

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  [![npm packages](https://img.shields.io/badge/npm_packages-7-green.svg)](https://www.npmjs.com/)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![oasis-company](https://img.shields.io/badge/oasis--company-ai--powered-orange.svg)](https://github.com/zbbsdsb)
</div>

---

## 📌 First Time Here?

**New team member?** Start with these docs:
- 👉 [OasisBio Relationship Guide](docs/OASISBIO_RELATIONSHIP.md) - Understand how this repo relates to the product
- 👉 [Team Onboarding Guide](docs/TEAM_ONBOARDING.md) - Step-by-step onboarding

---

## 🎯 Project Overview

**OasisBio** = Product/Brand name (the user-facing platform)  
**OasisBio-Ecosystem** = This monorepo (contains all the code that powers OasisBio)

This repo is a **monorepo of shared TypeScript packages and cross-platform applications** that power multiple Oasis Company products. It provides a comprehensive foundation for building cross-era digital identity management systems.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Cross-Platform Support** | Desktop (Electron), Android, iOS (Flutter), Web applications |
| **AI Assistants** | Deo (Technical) & Dia (Creative) AI-powered assistants |
| **World Builder 2.0** | Six-module world-building system with completion scoring |
| **OAuth 2.0 Integration** | Third-party application authorization |
| **Passwordless Auth** | Secure OTP-based authentication |
| **Type-Safe API** | End-to-end TypeScript with strict typing |
| **Modular Architecture** | Reusable packages for consistent development |

### 🏢 Powered Products

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

- **Node.js** 20+
- **pnpm** 9+ (recommended) or npm/yarn
- **Git**

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
# Install a specific package in your project
pnpm add @oasisbio/common-core
pnpm add @oasisbio/common-utils
pnpm add @oasisbio/common-validators
pnpm add @oasisbio/common-api
pnpm add @oasisbio/common-auth
```

### Running Desktop Application

```bash
# Navigate to desktop app
cd apps/desktop

# Run in development mode
pnpm dev

# Build for production
pnpm build
```

---

## 🛠️ Development Guide

### Project Structure

```
OasisBio-Ecosystem/
├── apps/                          # Applications
│   ├── desktop/                   # Electron desktop app
│   │   ├── electron/              # Electron main process
│   │   ├── src/                   # React application
│   │   │   ├── components/        # UI components
│   │   │   ├── pages/             # Page components
│   │   │   ├── hooks/             # Custom hooks
│   │   │   ├── services/          # API services
│   │   │   └── contexts/          # React contexts
│   │   └── package.json
│   ├── android/                   # Android native app
│   ├── flutter/                   # Flutter cross-platform app
│   ├── ios/                       # iOS specific configs
│   └── web/                       # Web application
├── packages/                      # Shared packages
│   ├── common-core/               # Core types, enums, constants
│   ├── common-utils/              # Shared utilities
│   ├── common-auth/               # Auth types & errors
│   ├── common-api/                # API interfaces
│   ├── common-validators/         # Zod validation schemas
│   ├── common-services/           # Shared services
│   ├── design-system/             # UI components (WIP)
│   └── identity-core/             # Identity mgmt (WIP)
├── docs/                          # Documentation
│   ├── api-reference.md           # API documentation
│   ├── architecture.md            # Architecture overview
│   └── ecosystem-roadmap.md       # Project roadmap
├── pnpm-workspace.yaml            # Workspace config
└── package.json                   # Root package.json
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm dev` | Build in watch mode |
| `pnpm test` | Run all tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint` | Lint all packages |

### Adding a New Package

1. Create package under `packages/<package-name>/`
2. Add to `pnpm-workspace.yaml`
3. Create `package.json` with proper TypeScript config
4. Run `pnpm install` to update lockfile
5. Add exports in `src/index.ts`

---

## 🧪 Testing

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

### Test Coverage Targets

| Package Type | Coverage Target |
|--------------|-----------------|
| Shared packages | 80%+ |
| Desktop app | 70%+ |
| Integration tests | 50%+ |

### Writing Tests

```typescript
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

## 📦 Build & Deployment

### Building Packages

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @oasisbio/common-core build
```

### Desktop Application

```bash
cd apps/desktop

# Development build
pnpm dev

# Production build (creates installer)
pnpm build

# Analyze bundle size
pnpm build:analyze
```

Output files in `apps/desktop/release/`:
- `OasisBio Desktop Setup x.x.x.exe` - NSIS installer
- `OasisBio Desktop-x.x.x-win.zip` - Portable archive

### Android Application

```bash
cd apps/android
./gradlew assembleDebug
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
  type WorldItem,
  type Ability,
  // Enums
  IdentityMode,
  Visibility,
  NuwaStatus,
  NuwaMode,
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

### @oasisbio/common-api

API client interfaces and endpoints.

```typescript
import {
  // Client interface
  type OasisBioApiClient,
  // Endpoints
  API_ENDPOINTS,
  // Request/Response types
  type CreateOasisBioRequest,
  type OasisBioResponse,
  type PaginatedResponse
} from '@oasisbio/common-api';
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Contribution Guide

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
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/)
- **Testing**: Jest for unit tests

---

## 📖 Documentation

### Getting Started
- [OasisBio Relationship Guide](docs/OASISBIO_RELATIONSHIP.md) - Understand how this repo fits in
- [Team Onboarding Guide](docs/TEAM_ONBOARDING.md) - Step-by-step onboarding

### Reference
- [API Reference](docs/api-reference.md) - Complete API documentation
- [Architecture](docs/architecture.md) - System architecture overview
- [Types Reference](docs/types-reference.md) - Type definitions
- [Ecosystem Roadmap](docs/ecosystem-roadmap.md) - Project roadmap

---

## 🔒 Security

For security concerns, please see [SECURITY.md](SECURITY.md).

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
