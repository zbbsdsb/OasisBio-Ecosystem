# OasisBio Ecosystem Architecture

## Overview

The OasisBio Ecosystem is a monorepo architecture designed to support cross-platform character management across multiple client applications. The shared packages provide a unified foundation for authentication, API communication, business logic, and validation.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Flutter App  │  Android App  │  Web App (Next.js)  │  Other Clients   │
└───────────────┴───────────────┴──────────────────────┴──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SHARED PACKAGES                                 │
├─────────────────────┬───────────────────────────────────────────────────┤
│   common-api        │  API Client Interface, Endpoints, Types           │
├─────────────────────┼───────────────────────────────────────────────────┤
│   common-auth       │  Auth Types, Error Handling, Constants            │
├─────────────────────┼───────────────────────────────────────────────────┤
│   common-services   │  Business Logic, Validation, User Sync           │
├─────────────────────┼───────────────────────────────────────────────────┤
│   common-validators │  Form Validation Utilities                        │
├─────────────────────┼───────────────────────────────────────────────────┤
│   common-utils      │  Utility Functions (string, date, crypto)         │
├─────────────────────┼───────────────────────────────────────────────────┤
│   common-core       │  Core Types, Models, Enums, Constants             │
└─────────────────────┴───────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API                                      │
│  Supabase Auth │  PostgreSQL (Prisma) │  Cloudflare R2 (Storage)       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Package Dependencies

```
common-api          common-auth
     │                   │
     ├── common-core     ├── common-core
     └── common-auth     └── common-utils
             │
             ▼
     common-services
           │
     ├── common-core
     ├── common-utils
     └── common-auth
```

## Core Components

### 1. common-core

**Responsibilities:**
- Prisma model interfaces (User, Profile, OasisBio, Ability, WorldItem, etc.)
- Business enums (IdentityMode, Visibility, NuwaStatus, etc.)
- API endpoint constants
- Validation rules and constraints
- Shared types (Result, ApiError, etc.)

**Key Files:**
- `src/models/*.ts` - Prisma model interfaces
- `src/enums/*.ts` - Type-safe enums
- `src/constants/*.ts` - API endpoints, validation rules, storage paths
- `src/types/*.ts` - Shared type definitions

### 2. common-utils

**Responsibilities:**
- String manipulation utilities
- Date formatting and parsing
- URL handling
- Validation helpers
- Cryptographic utilities
- Result type for error handling

**Key Modules:**
- `string.ts` - String operations
- `date.ts` - Date utilities
- `url.ts` - URL parsing and building
- `validation.ts` - Generic validation helpers
- `result.ts` - Result<T, E> type
- `crypto.ts` - Cryptographic functions
- `logger.ts` - Logging utilities

### 3. common-auth

**Responsibilities:**
- Authentication session types
- Auth state management
- OTP error handling
- Auth-related constants

**Key Types:**
- `AuthSession` - User session information
- `AuthState` - Authentication state (loading, authenticated, unauthenticated)
- `AuthCredentials` - Login credentials
- `OtpErrorResponse` - OTP error format

**Error Classes:**
- `AuthError` - Authentication errors with status codes
- `OtpError` - OTP-specific errors

### 4. common-api

**Responsibilities:**
- Type-safe API client interface
- API endpoint definitions
- Request/response type definitions

**Key Components:**
- `OasisBioApiClient` - Interface for API operations
- `API_ENDPOINTS` - Centralized endpoint URLs
- Request types (CreateOasisBioRequest, UpdateOasisBioRequest, etc.)
- Response types (OasisBioResponse, PaginatedResponse, etc.)

### 5. common-validators

**Responsibilities:**
- Form validation utilities
- Input sanitization
- Business rule validation

**Validators:**
- `auth-validators.ts` - Authentication form validation
- `profile-validators.ts` - User profile validation
- `oasisbio-validators.ts` - OasisBio creation/update validation
- `file-validators.ts` - File upload validation

### 6. common-services

**Responsibilities:**
- Core business logic implementation
- User synchronization
- Authorization checks
- Validation service

**Services:**
- `Validator` - Generic validation service
- `UserSyncService` - Syncs Supabase users to Prisma
- `AuthUtils` - Authorization and ownership checks

## Data Flow

### Authentication Flow

```
1. Client requests OTP via email
2. Supabase sends OTP to user's email
3. Client submits OTP for verification
4. Supabase verifies OTP and returns session
5. Session stored in cookies (HTTP-only, Secure)
6. Client includes session token in Authorization header
7. Server validates token and returns user data
8. UserSyncService syncs user to Prisma database
```

### OasisBio Creation Flow

```
1. Client calls POST /api/oasisbios
2. Server validates input (title required)
3. Server generates unique slug from title
4. Server creates OasisBio record in Prisma
5. Server returns created OasisBio with all fields
6. Client receives response and updates UI
```

### Publishing Flow

```
1. Client calls POST /api/oasisbios/{id}/publish
2. Server verifies ownership
3. Server calls publish_bio RPC in PostgreSQL
4. RPC validates publish requirements
5. RPC updates visibility and creates publication record
6. RPC logs audit event
7. Server returns publication status
```

## Security Considerations

### Authentication
- Passwordless OTP authentication only
- JWT tokens with short expiration (1 hour)
- Automatic token refresh
- HTTP-only cookies to prevent XSS

### Authorization
- Row-level ownership checks for all resources
- Middleware route protection for authenticated routes
- OAuth scopes for third-party app access

### Data Protection
- Input validation for all user inputs
- Rate limiting on authentication endpoints
- Encrypted data storage
- Secure headers (CSP, X-Content-Type-Options, etc.)

### API Security
- CSRF protection for state-changing operations
- Request validation and sanitization
- Error handling with generic messages (no stack traces)
- Audit logging for sensitive operations

## Scalability

### Package Structure
- Independent package versioning
- Decoupled dependencies
- Lazy loading support
- Tree-shakable modules

### Build Optimization
- tsup for fast builds
- Multiple output formats (CJS, ESM)
- TypeScript type declarations
- Source maps for debugging

### Deployment
- pnpm workspaces for monorepo management
- Shared dependencies across packages
- CI/CD integration
- Semantic versioning

## Testing Strategy

### Unit Tests
- Test individual functions and methods
- Mock external dependencies
- Verify edge cases and error handling

### Integration Tests
- Test interactions between packages
- Verify API client with mock server
- Test validation with various inputs

### Type Safety
- TypeScript strict mode
- Type checking on build
- Shared type definitions across packages

## Future Enhancements

### Planned Features
- GraphQL API support
- WebSocket real-time updates
- Multi-tenancy support
- Advanced search and filtering
- Export/import functionality

### Technical Improvements
- Performance monitoring
- Distributed tracing
- Feature flags
- A/B testing support
- Localization support
