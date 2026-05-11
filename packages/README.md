# OasisBio Common Packages

Shared utilities and types for the OasisBio ecosystem.

## Overview

This monorepo contains the following packages:

| Package | Description |
|---------|-------------|
| `@oasisbio/common-core` | Core types, enums, and constants |
| `@oasisbio/common-utils` | Utility functions (string, date, URL, validation, crypto, logging) |
| `@oasisbio/common-auth` | Authentication types and errors |
| `@oasisbio/common-api` | API client interface and endpoint definitions |
| `@oasisbio/common-validators` | Validation rules and validators |

## Installation

### Prerequisites

- Node.js 18+
- pnpm 9+

```bash
pnpm install
```

## Development

### Build All Packages

```bash
pnpm build
```

### Dev Mode (Watch)

```bash
pnpm dev
```

### Lint

```bash
pnpm lint
```

### Test

```bash
pnpm test
```

## Package Usage

### @oasisbio/common-core

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
  STORAGE_PATHS,
  // Result utilities
  ok,
  err,
  type Result
} from '@oasisbio/common-core';

// Example: Create a result
const result = ok({ data: 'test' });
const errorResult = err(new Error('Something went wrong'));
```

### @oasisbio/common-utils

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

// Example: Create a slug
const slug = slugify('My Character Name'); // my_character_name
```

### @oasisbio/common-auth

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

// Example: Throw an auth error
throw new AuthError('Unauthorized', 'UNAUTHORIZED', 401);
```

### @oasisbio/common-api

```typescript
import {
  // Client interface
  type OasisBioApiClient,
  // Error
  ApiError,
  // Endpoints
  API_ENDPOINTS
} from '@oasisbio/common-api';
```

### @oasisbio/common-validators

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

// Example: Validate create request
const validation = validateCreateOasisBio({
  title: 'My Character',
  slug: 'my_character',
  identityMode: IdentityMode.REAL
});

if (!validation.valid) {
  console.error(validation.errors);
}
```

## Project Structure

```
packages/
├── common-core/
│   ├── src/
│   │   ├── models/
│   │   ├── enums/
│   │   ├── constants/
│   │   ├── types/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── common-utils/
│   ├── src/
│   │   ├── string.ts
│   │   ├── date.ts
│   │   ├── url.ts
│   │   ├── validation.ts
│   │   ├── result.ts
│   │   ├── logger.ts
│   │   ├── crypto.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── common-auth/
│   ├── src/
│   │   ├── types.ts
│   │   ├── errors.ts
│   │   ├── constants.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── common-api/
│   ├── src/
│   │   ├── endpoints.ts
│   │   ├── client.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── common-validators/
    ├── src/
    │   ├── oasisbio-validators.ts
    │   ├── profile-validators.ts
    │   ├── auth-validators.ts
    │   ├── file-validators.ts
    │   └── index.ts
    ├── package.json
    └── tsconfig.json
```

## License

MIT
