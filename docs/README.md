# OasisBio Ecosystem

A monorepo for the OasisBio cross-era digital identity management platform. This repository contains shared libraries, API clients, validation utilities, and cross-platform application code.

## 📁 Project Structure

```
OasisBio-Ecosystem/
├── packages/                    # Shared TypeScript packages
│   ├── common-core/            # Core types, models, enums, constants
│   ├── common-utils/           # Utility functions (string, date, crypto)
│   ├── common-auth/            # Authentication types and error handling
│   ├── common-api/             # API client interface and endpoints
│   ├── common-validators/      # Form validation utilities
│   └── common-services/        # Business logic services
├── apps/                       # Platform-specific applications
│   ├── flutter/                # Flutter cross-platform client
│   │   ├── lib/
│   │   │   ├── blocs/          # BLoC state management
│   │   │   ├── models/         # Data models
│   │   │   ├── pages/          # UI pages
│   │   │   └── services/       # API/services
│   │   └── pubspec.yaml
│   └── [future: android, web]  # Future platform targets
├── docs/                       # Documentation
├── assets/                     # Shared assets (logos, icons)
├── package.json                # Monorepo scripts
└── pnpm-workspace.yaml         # Workspace configuration
```

## 📦 Packages

### common-core
Core TypeScript types, Prisma model interfaces, business enums, API endpoints, validation rules, and shared constants.

**Key Exports:**
- Prisma model interfaces (User, Profile, OasisBio, Ability, WorldItem, etc.)
- Business enums (IdentityMode, Visibility, NuwaStatus, AbilityCategory)
- API endpoint constants (`API_ENDPOINTS`)
- Validation rules (`VALIDATION_RULES`)
- Generic `Result<T, E>` type for error handling

### common-utils
Utility functions including string manipulation, date formatting, URL handling, validation helpers, cryptographic utilities, and logging.

**Key Modules:**
- `string.ts` - String operations and sanitization
- `date.ts` - Date parsing and formatting
- `url.ts` - URL building and parsing
- `validation.ts` - Generic validation helpers
- `result.ts` - Result type implementation
- `crypto.ts` - Cryptographic utilities
- `logger.ts` - Logging utilities

### common-auth
Authentication-related types, error classes, and constants for OAuth and OTP flows.

**Key Types:**
- `AuthSession` - User session information
- `AuthState` - Authentication state management
- `AuthCredentials` - Login credentials
- `OtpErrorResponse` - OTP error format

**Error Classes:**
- `AuthError` - Authentication errors with status codes
- `OtpError` - OTP-specific errors

### common-api
Type-safe API client interface with methods for all API resources, endpoint definitions, and request/response types.

**Key Components:**
- `OasisBioApiClient` - Interface for API operations
- `API_ENDPOINTS` - Centralized endpoint URLs
- Request types (CreateOasisBioRequest, UpdateOasisBioRequest, etc.)
- Response types (OasisBioResponse, PaginatedResponse, etc.)

### common-validators
Form validation utilities for authentication, profile, OasisBio, and file uploads.

**Validators:**
- `auth-validators.ts` - Authentication form validation
- `profile-validators.ts` - User profile validation
- `oasisbio-validators.ts` - OasisBio creation/update validation
- `file-validators.ts` - File upload validation

### common-services
Business logic services including validation service, user synchronization, and authorization utilities.

**Services:**
- `Validator` - Generic validation service
- `UserSyncService` - Syncs Supabase users to Prisma
- `AuthUtils` - Authorization and ownership checks

## 🔧 Getting Started

### Prerequisites
- **Node.js**: >= 20.x
- **pnpm**: >= 9.x
- **Flutter**: >= 3.3.0 (for mobile development)

### Installation

```bash
# Install all dependencies
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

# Start Flutter app (from apps/flutter directory)
cd apps/flutter
flutter run
```

## 🚀 Usage

### TypeScript/JavaScript

```typescript
import { OasisBio, IdentityMode, VALIDATION_RULES } from '@oasisbio/common-core';
import { API_ENDPOINTS } from '@oasisbio/common-api';
import { UserSyncService } from '@oasisbio/common-services';
import { ok, err } from '@oasisbio/common-utils';

// Create a new OasisBio instance
const bio: OasisBio = {
  id: 'bio_123',
  userId: 'user_456',
  title: 'My Character',
  slug: 'my-character',
  identityMode: IdentityMode.FICTIONAL,
  visibility: 'private',
  status: 'draft',
  defaultLanguage: 'zh-CN',
  featured: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  abilities: [],
  eras: [],
  dcosFiles: [],
  references: [],
  worlds: [],
  models: [],
};

// Use API endpoints
console.log(API_ENDPOINTS.OASISBIOS.LIST); // '/api/oasisbios'
console.log(API_ENDPOINTS.OASISBIOS.DETAIL('bio_123')); // '/api/oasisbios/bio_123'

// Use Result type for error handling
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err('Cannot divide by zero');
  }
  return ok(a / b);
}

// Sync user to database
const syncService = new UserSyncService(prismaClient);
const result = await syncService.syncUserToPrisma(supabaseUser);
```

## 🔄 API Reference

### Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Request OTP login |
| POST | `/api/auth/verify` | Verify OTP code |
| POST | `/api/auth/logout` | Logout user |

### OasisBio Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oasisbios` | List user's OasisBios |
| POST | `/api/oasisbios` | Create new OasisBio |
| GET | `/api/oasisbios/{id}` | Get OasisBio by ID |
| PUT | `/api/oasisbios/{id}` | Update OasisBio |
| DELETE | `/api/oasisbios/{id}` | Delete OasisBio |
| POST | `/api/oasisbios/{id}/publish` | Publish OasisBio |
| DELETE | `/api/oasisbios/{id}/publish` | Unpublish OasisBio |

### World Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oasisbios/{id}/worlds` | List worlds for OasisBio |
| POST | `/api/oasisbios/{id}/worlds` | Create new world |
| GET | `/api/worlds/{id}` | Get world by ID |
| PUT | `/api/worlds/{id}` | Update world |
| DELETE | `/api/worlds/{id}` | Delete world |

For complete API documentation, see [api-reference.md](api-reference.md).

## 🛡️ Security

- **Authentication**: Passwordless OTP authentication via Supabase
- **Authorization**: Row-level ownership checks for all resources
- **Data Protection**: Input validation, rate limiting, encrypted storage
- **Secure Headers**: CSP, X-Content-Type-Options, HTTP-only cookies
- **Error Handling**: Generic error messages (no stack traces exposed)

## 📱 Flutter Client

The Flutter client provides a cross-platform mobile experience for managing digital identities.

**Features:**
- Authentication flow (login/register with OTP)
- Dashboard with statistics
- OasisBio list with search and filters
- OasisBio detail view with abilities and eras
- Create and edit OasisBio forms

**Technical Stack:**
- Flutter 3.3+
- Flutter Bloc (state management)
- Dio (HTTP client)
- Shared Preferences (local storage)
- Material Design 3

## 📚 Documentation

- [README.md](README.md) - Project overview and getting started
- [architecture.md](architecture.md) - System architecture and design
- [api-reference.md](api-reference.md) - API endpoints and usage
- [types-reference.md](types-reference.md) - TypeScript type definitions
- [ecosystem-roadmap.md](ecosystem-roadmap.md) - Development roadmap

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Contact

For questions or feedback, please contact the OasisBio Engineering Team.
