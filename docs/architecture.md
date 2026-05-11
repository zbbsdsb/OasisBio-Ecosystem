# OasisBio Ecosystem Architecture

## Overview

The OasisBio Ecosystem is a monorepo architecture designed to support cross-platform character management across multiple client applications. The shared packages provide a unified foundation for authentication, API communication, business logic, and validation, ensuring consistency across all platform implementations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Flutter App  │  Android App  │  Web App (Next.js)  │  Other Clients   │
│     (iOS/Android)            │    (Browser/PWA)     │                  │
└───────┬───────┴───────┬───────┴──────────┬──────────┴──────────────────┘
        │               │                   │
        ▼               ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SHARED PACKAGES                                 │
│                           (TypeScript)                                  │
├─────────────┬───────────────────────────────────────────────────────────┤
│   common-api│  API Client Interface, Endpoints, Request/Response Types  │
├─────────────┼───────────────────────────────────────────────────────────┤
│  common-auth│  Auth Types, Error Handling, Session Management          │
├─────────────┼───────────────────────────────────────────────────────────┤
│common-services│ Business Logic, Validation Service, User Sync         │
├─────────────┼───────────────────────────────────────────────────────────┤
│common-validators│ Form Validation Utilities, Input Sanitization        │
├─────────────┼───────────────────────────────────────────────────────────┤
│ common-utils │  String/Date/URL Utilities, Crypto, Result Type         │
├─────────────┼───────────────────────────────────────────────────────────┤
│  common-core │  Core Types, Models, Enums, Constants, Validation Rules │
└───────┬─────┴───────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API                                      │
│  Supabase Auth │  PostgreSQL (Prisma) │  Cloudflare R2 (Storage)       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Package Dependencies

```
          common-api                    common-auth
               │                           │
               ├── common-core             ├── common-core
               └── common-auth             └── common-utils
                       │
                       ▼
               common-services
                     │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
    common-core common-utils common-auth
```

**Dependency Rules:**
- `common-core`: No external package dependencies (foundation layer)
- `common-utils`: Depends only on `common-core`
- `common-auth`: Depends on `common-core` and `common-utils`
- `common-api`: Depends on `common-core` and `common-auth`
- `common-validators`: Depends on `common-core` and `common-utils`
- `common-services`: Depends on all other packages

## Core Components

### 1. common-core

**Responsibilities:**
- Prisma model interfaces (User, Profile, OasisBio, Ability, WorldItem, etc.)
- Business enums (IdentityMode, Visibility, NuwaStatus, AbilityCategory)
- API endpoint constants
- Validation rules and constraints
- Shared types (Result, ApiError, PaginatedResponse)

**Key Files:**
- `src/models/*.ts` - Prisma model interfaces
- `src/enums/*.ts` - Type-safe enums
- `src/constants/api-endpoints.ts` - API endpoint URLs
- `src/constants/validation-rules.ts` - Validation constraints
- `src/types/*.ts` - Shared type definitions

**Design Principles:**
- Single source of truth for all data models
- Immutable constants to prevent runtime modifications
- Type-safe enums for business logic constraints

### 2. common-utils

**Responsibilities:**
- String manipulation utilities (truncation, sanitization, slug generation)
- Date formatting and parsing (ISO 8601, relative time)
- URL handling (building, parsing, query parameters)
- Validation helpers (regex patterns, type checks)
- Cryptographic utilities (hash generation, random strings)
- Result type for functional error handling

**Key Modules:**
- `string.ts` - String operations (slugify, truncate, sanitize)
- `date.ts` - Date utilities (format, parse, compare)
- `url.ts` - URL building and query parameter handling
- `validation.ts` - Generic validation helpers
- `result.ts` - Result<T, E> type implementation
- `crypto.ts` - Cryptographic functions (SHA-256, UUID)
- `logger.ts` - Logging utilities with log levels

**Design Principles:**
- Pure functions with no side effects
- Stateless utilities that can be imported anywhere
- Comprehensive error handling for edge cases

### 3. common-auth

**Responsibilities:**
- Authentication session types
- Auth state management interfaces
- OTP error handling
- Auth-related constants

**Key Types:**
- `AuthSession` - User session information (userId, email, expiresAt, token)
- `AuthState` - Authentication state (loading, authenticated, unauthenticated)
- `AuthCredentials` - Login credentials (email, password optional)
- `OtpErrorResponse` - OTP error format (code, message, retryDelay)

**Error Classes:**
- `AuthError` - Authentication errors with status codes and messages
- `OtpError` - OTP-specific errors (invalid code, expired, too many attempts)

**Design Principles:**
- Clear state transitions for authentication flow
- Type-safe error handling
- Support for multiple authentication methods (OTP, OAuth)

### 4. common-api

**Responsibilities:**
- Type-safe API client interface
- API endpoint definitions
- Request/response type definitions
- API error handling

**Key Components:**
- `OasisBioApiClient` - Interface for all API operations
- `API_ENDPOINTS` - Centralized endpoint URLs with parameter interpolation
- Request types (CreateOasisBioRequest, UpdateOasisBioRequest, etc.)
- Response types (OasisBioResponse, PaginatedResponse, ErrorResponse)

**Design Principles:**
- RESTful resource organization
- Type-safe request/response contracts
- Consistent error format across all endpoints

### 5. common-validators

**Responsibilities:**
- Form validation utilities
- Input sanitization
- Business rule validation
- Error message generation

**Validators:**
- `auth-validators.ts` - Email, username, OTP validation
- `profile-validators.ts` - Display name, bio, website validation
- `oasisbio-validators.ts` - Title, tagline, description validation
- `file-validators.ts` - File size, type, dimension validation

**Design Principles:**
- Reusable validation functions
- Configurable validation rules
- Localized error messages

### 6. common-services

**Responsibilities:**
- Core business logic implementation
- User synchronization between auth provider and database
- Authorization checks and ownership validation
- Validation service for form processing

**Services:**
- `Validator` - Generic validation service with form-level validation
- `UserSyncService` - Syncs Supabase users to Prisma database
- `AuthUtils` - Authorization and ownership checks

**Key Methods:**
- `Validator.validateRegisterForm()` - Validate registration form
- `Validator.validateSettingsForm()` - Validate user settings
- `UserSyncService.generateUniqueUsername()` - Generate unique username
- `UserSyncService.syncUserToPrisma()` - Sync user data
- `AuthUtils.requireAuth()` - Require authenticated user
- `AuthUtils.requireOasisBioOwnership()` - Require resource ownership

**Design Principles:**
- Dependency injection for database clients
- Transactional operations where needed
- Clear separation of concerns

## Data Flow

### Authentication Flow

```
1. Client requests OTP via POST /api/auth/login
2. Supabase generates and sends OTP to user's email
3. Client submits OTP via POST /api/auth/verify
4. Supabase verifies OTP and returns JWT session
5. Session stored in HTTP-only, Secure cookies
6. Client includes Authorization header with Bearer token
7. Server validates token and decodes user data
8. UserSyncService syncs user to Prisma database if needed
9. Server returns user profile data
```

### OasisBio Creation Flow

```
1. Client calls POST /api/oasisbios with form data
2. Server middleware validates authentication token
3. Server validates input (title required, max length, etc.)
4. Server generates unique slug from title
5. Server creates OasisBio record in Prisma
6. Server sets default visibility to 'private'
7. Server returns created OasisBio with all fields
8. Client receives response and updates UI state
```

### Publishing Flow

```
1. Client calls POST /api/oasisbios/{id}/publish
2. Server verifies authentication
3. Server checks ownership of the OasisBio
4. Server calls publish_bio RPC in PostgreSQL
5. RPC validates publish requirements (title, summary required)
6. RPC updates visibility to 'public'
7. RPC sets publishedAt timestamp
8. RPC creates publication audit record
9. Server returns publication status and updated OasisBio
```

## Security Considerations

### Authentication
- Passwordless OTP authentication only (no passwords stored)
- JWT tokens with short expiration (1 hour)
- Automatic token refresh mechanism
- HTTP-only, Secure cookies to prevent XSS
- CSRF protection for state-changing operations

### Authorization
- Row-level ownership checks for all resources
- Middleware route protection for authenticated routes
- OAuth scopes for third-party app access
- Role-based access control for admin operations

### Data Protection
- Input validation for all user inputs
- Rate limiting on authentication endpoints
- Encrypted data storage at rest
- Secure headers (CSP, X-Content-Type-Options, X-Frame-Options)
- Audit logging for sensitive operations

### API Security
- Request validation and sanitization
- Error handling with generic messages (no stack traces)
- Versioned API endpoints
- IP whitelisting for sensitive operations

## Scalability

### Package Structure
- Independent package versioning with semver
- Decoupled dependencies to minimize breaking changes
- Lazy loading support for large packages
- Tree-shakable modules for optimized bundle sizes

### Build Optimization
- tsup for fast, parallel builds
- Multiple output formats (CJS, ESM)
- TypeScript type declarations for IDE support
- Source maps for debugging production issues

### Deployment
- pnpm workspaces for monorepo management
- Shared dependencies across packages to reduce duplication
- CI/CD integration with GitHub Actions
- Semantic versioning for all packages

## Testing Strategy

### Unit Tests
- Test individual functions and methods in isolation
- Mock external dependencies
- Verify edge cases and error handling
- High code coverage target (≥70%)

### Integration Tests
- Test interactions between packages
- Verify API client with mock server
- Test validation with various inputs
- Test database operations with test containers

### Type Safety
- TypeScript strict mode enabled
- Type checking on every build
- Shared type definitions across packages
- No implicit any types

### E2E Tests
- Test complete user flows
- Verify authentication and authorization
- Test error scenarios
- Performance testing for critical paths

## Future Enhancements

### Planned Features
- GraphQL API support alongside REST
- WebSocket real-time updates for collaborative editing
- Multi-tenancy support for organizations
- Advanced search and filtering with Elasticsearch
- Export/import functionality for identities

### Technical Improvements
- Performance monitoring with OpenTelemetry
- Distributed tracing across services
- Feature flags for gradual rollouts
- A/B testing support
- Localization and internationalization

### Platform Expansion
- iOS native client
- Web/PWA client with Next.js
- Desktop client with Electron
- API SDK for third-party integrations

## Monitoring & Observability

### Logging
- Structured logging with correlation IDs
- Log aggregation with ELK stack
- Error tracking with Sentry
- Performance logging for slow operations

### Metrics
- API request latency
- Error rates by endpoint
- Authentication success/failure rates
- Database query performance

### Alerts
- Critical errors and downtime
- High error rates on endpoints
- Performance degradation
- Security anomalies

## Conclusion

The OasisBio Ecosystem architecture provides a solid foundation for building cross-platform character management applications. By leveraging shared packages and clear separation of concerns, the system ensures consistency, maintainability, and scalability across all client implementations.
