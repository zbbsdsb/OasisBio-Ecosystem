# OasisBio Ecosystem

A monorepo for the OasisBio character management platform, featuring shared libraries, API clients, and cross-platform utilities.

## 📁 Project Structure

```
OasisBio-Ecosystem/
├── packages/
│   ├── common-core/          # Core types, models, enums, constants
│   ├── common-utils/         # Utility functions
│   ├── common-auth/          # Authentication types and errors
│   ├── common-api/           # API client interface and endpoints
│   ├── common-validators/    # Form validators
│   └── common-services/      # Business logic services
├── apps/                     # Platform-specific clients (Flutter, Android, Web)
├── docs/                     # Documentation
└── assets/                   # Shared assets (logos, icons)
```

## 📦 Packages

### common-core
Core TypeScript types, Prisma model interfaces, business enums, API endpoints, validation rules, and shared constants.

### common-utils
Utility functions including string manipulation, date formatting, URL handling, validation helpers, and crypto utilities.

### common-auth
Authentication-related types, error classes, and constants for OAuth and OTP flows.

### common-api
Type-safe API client interface with methods for all API resources, endpoint definitions, and request/response types.

### common-validators
Form validation utilities for authentication, profile, OasisBio, and file uploads.

### common-services
Business logic services including validation service, user sync service, and authorization utilities.

## 🔧 Getting Started

### Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build a specific package
pnpm --filter @oasisbio/common-core build
```

### Development

```bash
# Watch all packages for changes
pnpm dev

# Watch a specific package
pnpm --filter @oasisbio/common-core dev
```

## 🚀 Usage

### TypeScript/JavaScript

```typescript
import { OasisBio, IdentityMode } from '@oasisbio/common-core';
import { API_ENDPOINTS } from '@oasisbio/common-api';
import { UserSyncService } from '@oasisbio/common-services';

// Create a new OasisBio instance
const bio: OasisBio = {
  id: 'bio_123',
  title: 'My Character',
  identityMode: IdentityMode.FICTIONAL,
  visibility: 'private',
  // ...
};

// Use API endpoints
console.log(API_ENDPOINTS.OASISBIOS.LIST); // '/api/oasisbios'

// Sync user to database
const syncService = new UserSyncService(prismaClient);
const result = await syncService.syncUserToPrisma(supabaseUser);
```

## 🔄 API Reference

### Auth Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with OTP
- `POST /api/auth/verify` - Verify OTP code
- `POST /api/auth/logout` - Logout user

### OasisBio Endpoints
- `GET /api/oasisbios` - List user's OasisBios
- `POST /api/oasisbios` - Create new OasisBio
- `GET /api/oasisbios/{id}` - Get OasisBio by ID
- `PUT /api/oasisbios/{id}` - Update OasisBio
- `DELETE /api/oasisbios/{id}` - Delete OasisBio
- `POST /api/oasisbios/{id}/publish` - Publish OasisBio
- `DELETE /api/oasisbios/{id}/publish` - Unpublish OasisBio

### World Endpoints
- `GET /api/oasisbios/{id}/worlds` - List worlds for OasisBio
- `POST /api/oasisbios/{id}/worlds` - Create new world
- `GET /api/worlds/{id}` - Get world by ID
- `PUT /api/worlds/{id}` - Update world
- `DELETE /api/worlds/{id}` - Delete world

## 🛡️ Security

- All API endpoints require authentication via JWT tokens
- Passwordless authentication using OTP (One-Time Password)
- Role-based access control for resource ownership
- Input validation for all user inputs
- Rate limiting on authentication endpoints

## 📄 License

MIT License - see LICENSE file for details.
