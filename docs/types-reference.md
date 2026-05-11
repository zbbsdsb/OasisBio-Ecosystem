# OasisBio Types Reference

## Core Models

### User

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

```typescript
interface Ability {
  id: string;
  oasisBioId: string;
  name: string;
  category: string;
  sourceType: 'custom' | 'official';
  level: number;
  description: string | null;
  relatedWorldId: string | null;
  relatedEraId: string | null;
}
```

### EraIdentity

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

```typescript
enum IdentityMode {
  REAL = 'real',
  FICTIONAL = 'fictional',
  HYBRID = 'hybrid',
  FUTURE = 'future',
  ALTERNATE = 'alternate'
}
```

### Visibility

```typescript
enum Visibility {
  PRIVATE = 'private',
  PUBLIC = 'public'
}
```

### NuwaStatus

```typescript
enum NuwaStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

### NuwaMode

```typescript
enum NuwaMode {
  SUGGEST = 'suggest',
  REFINE = 'refine',
  EXPAND = 'expand'
}
```

### AbilityCategory

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

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

### OasisBioResponse

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

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
```

---

## Auth Types

### AuthSession

```typescript
interface AuthSession {
  userId: string;
  email: string;
  expiresAt: Date;
  token: string;
}
```

### AuthState

```typescript
interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: User | null;
  session: AuthSession | null;
  error: Error | null;
}
```

### AuthCredentials

```typescript
interface AuthCredentials {
  email: string;
  password?: string;
}
```

---

## Result Type

### Result

```typescript
interface Result<T, E = Error> {
  ok: boolean;
  data?: T;
  error?: E;

  static ok<T>(data: T): Result<T, never>;
  static err<E>(error: E): Result<never, E>;
}
```

---

## Validation Rules

### ValidationRules

```typescript
interface ValidationRules {
  USERNAME: {
    MIN_LENGTH: number;
    MAX_LENGTH: number;
    PATTERN: RegExp;
  };
  EMAIL: {
    PATTERN: RegExp;
  };
  PASSWORD: {
    MIN_LENGTH: number;
    MAX_LENGTH: number;
  };
  OASISBIO_TITLE: {
    MIN_LENGTH: number;
    MAX_LENGTH: number;
  };
  SLUG: {
    PATTERN: RegExp;
  };
  FILE_SIZE: {
    AVATAR: number;
    CHARACTER_COVER: number;
    MODEL_PREVIEW: number;
    MODEL: number;
    EXPORT: number;
  };
}
```

---

## API Endpoints

### API_ENDPOINTS

```typescript
const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    VERIFY: '/api/auth/verify',
    LOGOUT: '/api/auth/logout'
  },
  OASISBIOS: {
    LIST: '/api/oasisbios',
    DETAIL: (id: string) => `/api/oasisbios/${id}`,
    PUBLISH: (id: string) => `/api/oasisbios/${id}/publish`,
    PUBLIC: '/api/oasisbios/public'
  },
  ABILITIES: {
    LIST: (oasisBioId: string) => `/api/oasisbios/${oasisBioId}/abilities`,
    DETAIL: (id: string) => `/api/abilities/${id}`
  },
  WORLDS: {
    LIST: (oasisBioId: string) => `/api/oasisbios/${oasisBioId}/worlds`,
    DETAIL: (id: string) => `/api/worlds/${id}`,
    DOCUMENTS: (worldId: string) => `/api/worlds/${worldId}/documents`
  },
  DCOS: {
    LIST: (oasisBioId: string) => `/api/oasisbios/${oasisBioId}/dcos`,
    DETAIL: (id: string) => `/api/dcos/${id}`
  },
  REFERENCES: {
    LIST: (oasisBioId: string) => `/api/oasisbios/${oasisBioId}/references`,
    DETAIL: (id: string) => `/api/references/${id}`
  },
  ERAS: {
    LIST: (oasisBioId: string) => `/api/oasisbios/${oasisBioId}/eras`,
    DETAIL: (id: string) => `/api/eras/${id}`
  },
  PROFILE: '/api/profile',
  DASHBOARD: '/api/dashboard',
  SETTINGS: '/api/settings'
};
```
