# OasisBio API Reference

## Overview

The OasisBio API provides RESTful endpoints for managing digital identities, worlds, abilities, and AI assistant interactions.

## Base URL

All API endpoints are prefixed with `/api`.

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:3000/api` |
| Production | `https://api.oasisbio.dev/api` |

---

## Authentication

### Overview

All authenticated endpoints require a valid JWT token in the `Authorization` header:

```http
Authorization: Bearer <token>
```

### Authentication Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Request OTP    │────▶│  Receive OTP    │────▶│  Verify OTP     │
│  POST /login    │     │  (via email)    │     │  POST /verify   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  Receive JWT    │
                                                │  Token + User   │
                                                └─────────────────┘
```

1. **Request OTP**: POST `/api/auth/login` with email
2. **Receive OTP**: Check email for one-time password
3. **Verify OTP**: POST `/api/auth/verify` with email and OTP
4. **Receive Token**: Server returns JWT token in response
5. **Authenticate Requests**: Include token in Authorization header

---

## Error Handling

### Error Response Format

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
| `NETWORK_ERROR` | - | Network connectivity issue |
| `TIMEOUT` | 408 | Request timeout |

### Error Handling Best Practices

```typescript
import { createError, OasisBioError, ERROR_CODES } from './utils/errors';

try {
  const response = await api.getData();
} catch (error) {
  if (error instanceof OasisBioError) {
    switch (error.code) {
      case ERROR_CODES.UNAUTHORIZED:
        // Redirect to login
        break;
      case ERROR_CODES.NETWORK_ERROR:
        // Show offline message, retry
        break;
      default:
        // Show generic error
    }
  }
}
```

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

## OAuth 2.0 Endpoints

### GET /api/oauth/apps

List registered OAuth applications for the current user.

**Response:**
```json
{
  "data": [
    {
      "id": "app_123",
      "name": "My Application",
      "clientId": "client_xxx",
      "redirectUri": "https://example.com/callback",
      "scopes": ["read:profile", "read:oasisbios"],
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

### POST /api/oauth/apps

Register a new OAuth application.

**Request Body:**
```json
{
  "name": "My Application",
  "redirectUri": "https://example.com/callback",
  "scopes": ["read:profile", "read:oasisbios"],
  "description": "Application description"
}
```

**Response:**
```json
{
  "id": "app_123",
  "name": "My Application",
  "clientId": "client_xxx",
  "clientSecret": "secret_xxx",
  "redirectUri": "https://example.com/callback",
  "scopes": ["read:profile", "read:oasisbios"]
}
```

### GET /api/oauth/authorize

OAuth authorization endpoint (user consent page).

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| client_id | Yes | OAuth client ID |
| redirect_uri | Yes | Redirect URI |
| response_type | Yes | Always "code" |
| scope | Yes | Space-separated scopes |
| state | No | CSRF state token |

### POST /api/oauth/token

Exchange authorization code for access token.

**Request Body:**
```json
{
  "grant_type": "authorization_code",
  "code": "auth_code_xxx",
  "client_id": "client_xxx",
  "client_secret": "secret_xxx",
  "redirect_uri": "https://example.com/callback"
}
```

**Response:**
```json
{
  "access_token": "access_xxx",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_xxx"
}
```

### Available OAuth Scopes

| Scope | Description |
|-------|-------------|
| `read:profile` | Read user profile |
| `write:profile` | Update user profile |
| `read:oasisbios` | Read user's OasisBios |
| `write:oasisbios` | Create/update OasisBios |
| `read:worlds` | Read world data |
| `write:worlds` | Create/update worlds |

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
  "abilities": [],
  "eras": [],
  "dcosFiles": [],
  "references": [],
  "worlds": [],
  "models": []
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

## AI Assistant Endpoints

### GET /api/assistant/sessions

List assistant sessions for the current user.

**Response:**
```json
{
  "data": [
    {
      "id": "sess_123",
      "agentId": "deo",
      "title": "Code Review Session",
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-14T12:30:00Z",
      "messageCount": 15
    }
  ]
}
```

### POST /api/assistant/sessions

Create a new assistant session.

**Request Body:**
```json
{
  "agentId": "deo",
  "title": "New Session"
}
```

| agentId | Description |
|---------|-------------|
| `deo` | Technical Assistant (programming, architecture, debugging) |
| `dia` | Creative Partner (writing, brainstorming, story ideation) |

**Response:**
```json
{
  "id": "sess_123",
  "agentId": "deo",
  "title": "New Session",
  "createdAt": "2024-01-15T08:00:00Z"
}
```

### GET /api/assistant/sessions/{id}/messages

Get messages for a session.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 50 | Number of messages |
| before | string | - | Message ID for pagination |

**Response:**
```json
{
  "data": [
    {
      "id": "msg_123",
      "role": "user",
      "content": "Help me debug this code",
      "createdAt": "2024-01-15T08:00:00Z"
    },
    {
      "id": "msg_124",
      "role": "assistant",
      "content": "I'd be happy to help! Please share the code...",
      "createdAt": "2024-01-15T08:01:00Z"
    }
  ]
}
```

### POST /api/assistant/sessions/{id}/messages

Send a message to the assistant.

**Request Body:**
```json
{
  "content": "Help me debug this code",
  "attachments": []
}
```

**Response (Streaming):**
```
data: {"type": "text", "content": "I'd be happy"}
data: {"type": "text", "content": " to help!"}
data: {"type": "done", "messageId": "msg_124"}
```

### PUT /api/assistant/sessions/{id}

Update session (rename).

**Request Body:**
```json
{
  "title": "Updated Session Title"
}
```

### DELETE /api/assistant/sessions/{id}

Delete a session and all its messages.

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
      "factions": "Kingdoms, guilds, dark lords",
      "completionScore": 75
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

### GET /api/worlds/{id}/completion

Get world completion score breakdown.

**Response:**
```json
{
  "score": 75,
  "breakdown": {
    "coreIdentity": 100,
    "timeStructure": 80,
    "spaceStructure": 60,
    "society": 70,
    "rules": 50,
    "content": 90
  }
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
| /api/assistant/* | 30 requests | 1 minute |
| All others | 100 requests | 1 minute |

---

## Versioning

The API is versioned via URL: `/api/v1/...`

Current version: v1

---

## Changelog

### v1.1.0 (Latest)
- Added AI Assistant endpoints (sessions, messages)
- Added OAuth 2.0 endpoints
- Added world completion score endpoint
- Improved error handling with detailed codes

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
