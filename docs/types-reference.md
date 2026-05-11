# OasisBio Types Reference

## Overview

This document provides detailed TypeScript type definitions for the OasisBio ecosystem. All types are exported from the `@oasisbio/common-core` and related packages.

---

## Core Models

### User

Represents a user account in the system.

```typescript
interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Profile

User profile information with additional metadata.

```typescript
interface Profile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  website: string | null;
  locale: string;
  defaultLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### OasisBio

Core character identity model.

```typescript
interface OasisBio {
  id: string;
  userId: string;
  title: string;
  slug: string;
  tagline: string | null;
  summary: string | null;
  identityMode: IdentityMode;
  birthDate: Date | null;
  gender: string | null;
  pronouns: string | null;
  originPlace: string | null;
  currentEra: string | null;
  species: string | null;
  status: 'draft' | 'active';
  description: string | null;
  coverImageUrl: string | null;
  defaultLanguage: string;
  visibility: Visibility;
  featured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  abilities: Ability[];
  eras: EraIdentity[];
  dcosFiles: DcosFile[];
  references: ReferenceItem[];
  worlds: WorldItem[];
  models: ModelItem[];
}
```

### Ability

Character ability or skill.

```typescript
interface Ability {
  id: string;
  oasisBioId: string;
  name: string;
  category: AbilityCategory;
  sourceType: 'custom' | 'official';
  level: number;
  description: string | null;
  relatedWorldId: string | null;
  relatedEraId: string | null;
}
```

### EraIdentity

Time period or era associated with a character.

```typescript
interface EraIdentity {
  id: string;
  oasisBioId: string;
  name: string;
  eraType: 'past' | 'present' | 'future' | 'alternate' | 'worldbound';
  startYear: number | null;
  endYear: number | null;
  description: string | null;
  sortOrder: number;
}
```

### DcosFile

Long-form documentation file (DCOS = Digital Character Operating System).

```typescript
interface DcosFile {
  id: string;
  oasisBioId: string;
  title: string;
  slug: string;
  content: string;
  folderPath: string;
  status: 'draft' | 'published';
  version: number;
  eraId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### ReferenceItem

External reference or source material.

```typescript
interface ReferenceItem {
  id: string;
  oasisBioId: string;
  url: string;
  title: string;
  description: string | null;
  sourceType: string;
  provider: string | null;
  coverImage: string | null;
  metadata: string | null;
  eraId: string | null;
  worldId: string | null;
  tags: string;
}
```

### WorldItem

Fictional world or setting.

```typescript
interface WorldItem {
  id: string;
  oasisBioId: string;
  name: string;
  summary: string;
  timeSetting: string | null;
  geography: string | null;
  physicsRules: string | null;
  socialStructure: string | null;
  aestheticKeywords: string | null;
  majorConflict: string | null;
  visibility: Visibility;
  timeline: string | null;
  rules: string | null;
  factions: string | null;
  
  // Relations
  documents: WorldDocument[];
}
```

### WorldDocument

Document within a world.

```typescript
interface WorldDocument {
  id: string;
  worldId: string;
  title: string;
  docType: string;
  slug: string;
  content: string;
  folderPath: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### ModelItem

3D model asset.

```typescript
interface ModelItem {
  id: string;
  oasisBioId: string;
  modelName: string;
  filePath: string;
  modelFormat: string;
  previewImage: string | null;
  relatedWorldId: string | null;
  relatedEraId: string | null;
  isPrimary: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Enums

### IdentityMode

Defines the type of identity for an OasisBio.

```typescript
enum IdentityMode {
  REAL = 'real',           // Real person/historical figure
  FICTIONAL = 'fictional', // Completely fictional character
  HYBRID = 'hybrid',       // Mix of real and fictional
  FUTURE = 'future',       // Future/possible identity
  ALTERNATE = 'alternate'  // Alternate universe/timeline
}
```

### Visibility

Controls visibility of resources.

```typescript
enum Visibility {
  PRIVATE = 'private',
  PUBLIC = 'public'
}
```

### NuwaStatus

Status for AI generation tasks.

```typescript
enum NuwaStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

### NuwaMode

Mode for AI generation operations.

```typescript
enum NuwaMode {
  SUGGEST = 'suggest',
  REFINE = 'refine',
  EXPAND = 'expand'
}
```

### AbilityCategory

Categories for character abilities.

```typescript
enum AbilityCategory {
  COMBAT = 'combat',
  MAGIC = 'magic',
  TECH = 'tech',
  SOCIAL = 'social',
  KNOWLEDGE = 'knowledge',
  PHYSICAL = 'physical',
  CREATIVE = 'creative',
  SURVIVAL = 'survival'
}
```

---

## API Request Types

### RegisterRequest

```typescript
interface RegisterRequest {
  email: string;
  username: string;
  displayName: string;
}
```

### LoginRequest

```typescript
interface LoginRequest {
  email: string;
}
```

### VerifyOtpRequest

```typescript
interface VerifyOtpRequest {
  email: string;
  otp: string;
}
```

### CreateOasisBioRequest

```typescript
interface CreateOasisBioRequest {
  title: string;
  tagline?: string;
  summary?: string;
  identityMode?: IdentityMode;
  birthDate?: string;
  gender?: string;
  pronouns?: string;
  originPlace?: string;
  currentEra?: string;
  species?: string;
  status?: 'draft' | 'active';
  description?: string;
  coverImageUrl?: string;
}
```

### UpdateOasisBioRequest

```typescript
interface UpdateOasisBioRequest {
  title?: string;
  tagline?: string | null;
  summary?: string | null;
  identityMode?: IdentityMode;
  birthDate?: string | null;
  gender?: string | null;
  pronouns?: string | null;
  originPlace?: string | null;
  currentEra?: string | null;
  species?: string | null;
  status?: 'draft' | 'active';
  description?: string | null;
  coverImageUrl?: string | null;
  visibility?: Visibility;
}
```

### CreateAbilityRequest

```typescript
interface CreateAbilityRequest {
  name: string;
  category: string;
  level?: number;
  description?: string;
  relatedWorldId?: string;
  relatedEraId?: string;
}
```

### CreateWorldRequest

```typescript
interface CreateWorldRequest {
  name: string;
  summary: string;
  timeSetting?: string;
  geography?: string;
  physicsRules?: string;
  socialStructure?: string;
  majorConflict?: string;
  timeline?: string;
  rules?: string;
  factions?: string;
  visibility?: Visibility;
}
```

---

## API Response Types

### PaginatedResponse

Generic paginated response wrapper.

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

### OasisBioResponse

Extended OasisBio with count information.

```typescript
interface OasisBioResponse extends OasisBio {
  _count?: {
    abilities: number;
    worlds: number;
    eras: number;
    dcosFiles: number;
    references: number;
    models: number;
  };
}
```

### ErrorResponse

Standard error response format.

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}
```

### AuthResponse

Authentication response with token.

```typescript
interface AuthResponse {
  ok: boolean;
  token: string;
  user: User;
  expiresAt: Date;
}
```

---

## Auth Types

### AuthSession

User session information.

```typescript
interface AuthSession {
  userId: string;
  email: string;
  expiresAt: Date;
  token: string;
}
```

### AuthState

Authentication state management.

```typescript
interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: User | null;
  session: AuthSession | null;
  error: Error | null;
}
```

### AuthCredentials

Login credentials (passwordless).

```typescript
interface AuthCredentials {
  email: string;
  password?: string;
}
```

---

## Result Type

### Result

Functional error handling type.

```typescript
interface Result<T, E = Error> {
  ok: boolean;
  data?: T;
  error?: E;

  static ok<T>(data: T): Result<T, never>;
  static err<E>(error: E): Result<never, E>;
}
```

**Usage:**
```typescript
import { ok, err } from '@oasisbio/common-utils';

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err('Cannot divide by zero');
  }
  return ok(a / b);
}

const result = divide(10, 2);
if (result.ok) {
  console.log(result.data); // 5
} else {
  console.error(result.error);
}
```

---

## Validation Rules

### ValidationRules

Centralized validation constraints.

```typescript
interface ValidationRules {
  USERNAME: {
    MIN_LENGTH: number;      // 3
    MAX_LENGTH: number;      // 20
    PATTERN: RegExp;         // /^[a-z0-9_]+$/i
  };
  EMAIL: {
    PATTERN: Reg