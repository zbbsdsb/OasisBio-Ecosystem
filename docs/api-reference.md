# OasisBio API Reference

## Base URL

All API endpoints are prefixed with `/api`.

**Development:** `http://localhost:3000/api`  
**Production:** `https://api.oasisbio.dev/api`

## Authentication

All authenticated endpoints require a valid JWT token in the `Authorization` header:

```http
Authorization: Bearer <token>
```

### Authentication Flow

1. **Request OTP**: POST `/api/auth/login` with email
2. **Receive OTP**: Check email for one-time password
3. **Verify OTP**: POST `/api/auth/verify` with email and OTP
4. **Receive Token**: Server returns JWT token in response
5. **Authenticate Requests**: Include token in Authorization header

## Error Format

All error responses follow this consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "optional field-specific error"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | No valid authentication token |
| `FORBIDDEN` | 403 | Valid token but insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `INTERNAL_ERROR` | 500 | Server error |
| `RATE_LIMITED` | 429 | Too many requests |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate username) |

---

## Auth Endpoints

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "unique_username",
  "displayName": "Display Name"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| username | string | Yes | Unique username (3-20 chars, alphanumeric) |
| displayName | string | Yes | User's display name |

**Response:**
```json
{
  "ok": true,
  "message": "Registration successful. Please check your email for verification."
}
```

### POST /api/auth/login

Request OTP login (passwordless authentication).

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "OTP sent to your email"
}
```

### POST /api/auth/verify

Verify OTP code and authenticate user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "name": "Display Name"
  },
  "expiresAt": "2024-01-15T10:30:00Z"
}
```

### POST /api/auth/logout

Logout current user (invalidates session).

**Response:**
```json
{
  "ok": true,
  "message": "Successfully logged out"
}
```

---

## OasisBio Endpoints

### GET /api/oasisbios

List all OasisBios for the authenticated user.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| status | string | - | Filter by status (draft/active) |
| visibility | string | - | Filter by visibility (private/public) |
| search | string | - | Search by title/tagline |

**Response:**
```json
{
  "data": [
    {
      "id": "bio_123",
      "title": "My Character",
      "slug": "my-character",
      "tagline": "A legendary hero",
      "identityMode": "fictional",
      "visibility": "private",
      "status": "active",
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-14T12:30:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### POST /api/oasisbios

Create a new OasisBio.

**Request Body:**
```json
{
  "title": "My Character",
  "tagline": "A brief description",
  "summary": "A longer summary of the character",
  "identityMode": "fictional",
  "birthDate": "1990-01-15",
  "gender": "male",
  "pronouns": "he/him",
  "originPlace": "Fantasy World",
  "currentEra": "Modern",
  "species": "Human",
  "status": "draft",
  "description": "Detailed description...",
  "coverImageUrl": "https://example.com/cover.jpg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Character title (3-200 chars) |
| tagline | string | No | Short tagline (max 100 chars) |
| summary | string | No | Summary text (max 500 chars) |
| identityMode | string | No | real/fictional/hybrid/future/alternate |
| birthDate | string | No | ISO date string |
| gender | string | No | Gender identity |
| pronouns | string | No | Preferred pronouns |
| originPlace | string | No | Place of origin |
| currentEra | string | No | Current era setting |
| species | string | No | Species/Race |
| status | string | No | draft/active (default: draft) |
| description | string | No | Full description |
| coverImageUrl | string | No | Cover image URL |

**Response:**
```json
{
  "id": "bio_123",
  "title": "My Character",
  "slug": "my-character",
  "visibility": "private",
  "status": "draft",
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T08:00:00Z"
}
```

### GET /api/oasisbios/{id}

Get a specific OasisBio by ID.

**Response:**
```json
{
  "id": "bio_123",
  "title": "My Character",
  "slug": "my-character",
  "tagline": "A legendary hero",
  "summary": "Summary text",
  "identityMode": "fictional",
  "birthDate": "1990-01-15",
  "gender": "male",
  "pronouns": "he/him",
  "originPlace": "Fantasy World",
  "currentEra": "Modern",
  "species": "Human",
  "status": "active",
  "description": "Detailed description...",
  "coverImageUrl": "https://example.com/cover.jpg",
  "visibility": "public",
  "featured": false,
  "publishedAt": "2024-01-14T10:00:00Z",
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-14T12:30:00Z",
  "abilities": [...],
  "eras": [...],
  "dcosFiles": [...],
  "references": [...],
  "worlds": [...],
  "models": [...]
}
```

### PUT /api/oasisbios/{id}

Update an existing OasisBio.

**Request Body:** (any fields from the OasisBio model, all optional)
```json
{
  "title": "Updated Title",
  "tagline": "Updated tagline",
  "visibility": "public"
}
```

**Response:** Same as GET /api/oasisbios/{id}

### DELETE /api/oasisbios/{id}

Delete an OasisBio (requires ownership).

**Response:**
```json
{
  "ok": true,
  "message": "OasisBio deleted successfully"
}
```

### POST /api/oasisbios/{id}/publish

Publish an OasisBio (make it public).

**Request Body:**
```json
{
  "visibility": "public"
}
```

**Response:**
```json
{
  "ok": true,
  "slug": "my-character",
  "publishedAt": "2024-01-15T10:00:00Z",
  "visibility": "public"
}
```

### DELETE /api/oasisbios/{id}/publish

Unpublish an OasisBio (make it private).

**Response:**
```json
{
  "ok": true,
  "message": "OasisBio unpublished successfully"
}
```

### GET /api/oasisbios/public

List public OasisBios (no authentication required).

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| search | string | - | Search by title/tagline |

**Response:**
```json
{
  "data": [
    {
      "id": "bio_123",
      "title": "Public Character",
      "slug": "public-character",
      "tagline": "A public character",
      "identityMode": "fictional",
      "currentEra": "Modern",
      "coverImageUrl": "https://example.com/cover.jpg"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

## Ability Endpoints

### GET /api/oasisbios/{id}/abilities

List abilities for an OasisBio.

**Response:**
```json
{
  "data": [
    {
      "id": "abl_123",
      "name": "Fireball",
      "category": "magic",
      "level": 3,
      "description": "Throws a fireball at target",
      "sourceType": "custom",
      "relatedWorldId": "wrld_456",
      "relatedEraId": "era_789"
    }
  ]
}
```

### POST /api/oasisbios/{id}/abilities

Create a new ability.

**Request Body:**
```json
{
  "name": "Fireball",
  "category": "magic",
  "level": 3,
  "description": "Throws a fireball at target",
  "relatedWorldId": "wrld_456",
  "relatedEraId": "era_789"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Ability name |
| category | string | Yes | combat/magic/tech/social/knowledge/physical/creative/survival |
| level | number | No | 1-5 (default: 1) |
| description | string | No | Ability description |
| relatedWorldId | string | No | Related world ID |
| relatedEraId | string | No | Related era ID |

**Response:** Created ability object.

### PUT /api/abilities/{id}

Update an ability.

**Request Body:** Same as POST, all fields optional.

### DELETE /api/abilities/{id}

Delete an ability.

**Response:**
```json
{
  "ok": true
}
```

---

## World Endpoints

### GET /api/oasisbios/{id}/worlds

List worlds for an OasisBio.

**Response:**
```json
{
  "data": [
    {
      "id": "wrld_123",
      "name": "Fantasy World",
      "summary": "A magical fantasy realm",
      "visibility": "private",
      "timeSetting": "Medieval",
      "geography": "Mountains and forests",
      "physicsRules": "Magic exists",
      "socialStructure": "Feudal system",
      "majorConflict": "Good vs Evil",
      "timeline": "1000 years of history",
      "rules": "Magic rules",
      "factions": "Kingdoms, guilds, dark lords"
    }
  ]
}
```

### POST /api/oasisbios/{id}/worlds

Create a new world.

**Request Body:**
```json
{
  "name": "Fantasy World",
  "summary": "A magical fantasy realm",
  "timeSetting": "Medieval",
  "geography": "Mountains and forests",
  "physicsRules": "Magic exists",
  "socialStructure": "Feudal system",
  "majorConflict": "Good vs Evil",
  "timeline": "1000 years of history",
  "rules": "Magic rules",
  "factions": "Kingdoms, guilds, dark lords",
  "visibility": "private"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | World name |
| summary | string | Yes | Brief summary |
| timeSetting | string | No | Time period |
| geography | string | No | Geographic description |
| physicsRules | string | No | World physics rules |
| socialStructure | string | No | Social structure |
| majorConflict | string | No | Main conflict |
| timeline | string | No | World timeline |
| rules | string | No | World rules |
| factions | string | No | Factions/groups |
| visibility | string | No | private/public |

### GET /api/worlds/{id}

Get a world by ID.

**Response:** Same as world object in list response.

### PUT /api/worlds/{id}

Update a world.

**Request Body:** Same as POST, all fields optional.

### DELETE /api/worlds/{id}

Delete a world.

---

## DCOS Endpoints

### GET /api/oasisbios/{id}/dcos

List DCOS files for an OasisBio.

**Response:**
```json
{
  "data": [
    {
      "id": "dcos_123",
      "title": "Character Background",
      "slug": "character-background",
      "content": "Long-form content...",
      "folderPath": "/documents",
      "status": "published",
      "version": 2,
      "eraId": "era_456",
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-14T12:00:00Z"
    }
  ]
}
```

### POST /api/oasisbios/{id}/dcos

Create a DCOS file.

**Request Body:**
```json
{
  "title": "Character Background",
  "content": "Long-form content...",
  "slug": "character-background",
  "folderPath": "/documents",
  "status": "draft",
  "eraId": "era_456"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Document title |
| content | string | Yes | Document content |
| slug | string | No | URL-friendly identifier |
| folderPath | string | No | Folder path |
| status | string | No | draft/published |
| eraId | string | No | Related era ID |

### PUT /api/dcos/{id}

Update a DCOS file.

### DELETE /api/dcos/{id}

Delete a DCOS file.

---

## Reference Endpoints

### GET /api/oasisbios/{id}/references

List references for an OasisBio.

### POST /api/oasisbios/{id}/references

Create a reference.

**Request Body:**
```json
{
  "url": "https://example.com/reference",
  "title": "Reference Article",
  "description": "Useful reference material",
  "sourceType": "article",
  "provider": "Example.com",
  "coverImage": "https://example.com/cover.jpg",
  "eraId": "era_456",
  "worldId": "wrld_789",
  "tags": "fantasy, magic, reference"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | Yes | Reference URL |
| title | string | Yes | Reference title |
| description | string | No | Description |
| sourceType | string | No | article/video/website |
| provider | string | No | Content provider |
| coverImage | string | No | Thumbnail URL |
| eraId | string | No | Related era ID |
| worldId | string | No | Related world ID |
| tags | string | No | Comma-separated tags |

### PUT /api/references/{id}

Update a reference.

### DELETE /api/references/{id}

Delete a reference.

---

## Era Endpoints

### GET /api/oasisbios/{id}/eras

List eras for an OasisBio.

### POST /api/oasisbios/{id}/eras

Create an era.

**Request Body:**
```json
{
  "name": "Golden Age",
  "eraType": "past",
  "description": "A time of prosperity",
  "startYear": -1000,
  "endYear": -500
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Era name |
| eraType | string | Yes | past/present/future/alternate/worldbound |
| description | string | No | Era description |
| startYear | number | No | Start year (BC negative) |
| endYear | number | No | End year |

### PUT /api/eras/{id}

Update an era.

### DELETE /api/eras/{id}

Delete an era.

---

## User Endpoints

### GET /api/profile

Get current user's profile.

**Response:**
```json
{
  "user": {
    "id": "usr_123",
    "name": "Display Name",
    "email": "user@example.com"
  },
  "profile": {
    "id": "prof_123",
    "username": "unique_username",
    "displayName": "Display Name",
    "avatarUrl": "https://example.com/avatar.jpg",
    "bio": "About me...",
    "website": "https://example.com",
    "locale": "zh-CN",
    "defaultLanguage": "zh-CN"
  }
}
```

### PUT /api/profile

Update profile.

**Request Body:**
```json
{
  "username": "new_username",
  "displayName": "New Display Name",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "bio": "Updated bio...",
  "website": "https://new-website.com",
  "locale": "en-US",
  "defaultLanguage": "en-US"
}
```

### GET /api/dashboard

Get dashboard statistics.

**Response:**
```json
{
  "stats": {
    "oasisBios": 5,
    "abilities": 20,
    "worlds": 3,
    "models": 2,
    "references": 15,
    "dcosFiles": 8,
    "eras": 4
  },
  "recentActivities": [
    {
      "id": "act_123",
      "type": "create",
      "title": "My Character",
      "slug": "my-character",
      "timestamp": "2024-01-15T08:00:00Z"
    }
  ]
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/auth/login | 5 requests | 1 minute |
| /api/auth/verify | 5 attempts | 1 minute |
| All others | 100 requests | 1 minute |

## Versioning

The API is versioned via URL: `/api/v1/...`

Current version: v1

## Changelog

### v1.0.0
- Initial release
- Auth endpoints (register, login, verify, logout)
- OasisBio CRUD operations
- Ability management
- World management
- DCOS file management
- Reference management
- Era management
- Profile management
- Dashboard statistics
