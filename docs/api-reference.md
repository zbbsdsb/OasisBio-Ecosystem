# OasisBio API Reference

## Base URL

All API endpoints are prefixed with `/api`.

## Authentication

All authenticated endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Error Format

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
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

---

## Auth Endpoints

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "string",
  "username": "string",
  "displayName": "string"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Registration successful"
}
```

### POST /api/auth/login

Login with email (sends OTP).

**Request Body:**
```json
{
  "email": "string"
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

Verify OTP code.

**Request Body:**
```json
{
  "email": "string",
  "otp": "string"
}
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": "string",
    "email": "string",
    "name": "string"
  }
}
```

### POST /api/auth/logout

Logout current user.

**Response:**
```json
{
  "ok": true
}
```

---

## OasisBio Endpoints

### GET /api/oasisbios

List all OasisBios for the authenticated user.

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "tagline": "string",
      "identityMode": "real|fictional|hybrid|future|alternate",
      "visibility": "private|public",
      "createdAt": "datetime",
      "updatedAt": "datetime"
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
  "title": "string (required)",
  "tagline": "string",
  "summary": "string",
  "identityMode": "real|fictional|hybrid|future|alternate",
  "birthDate": "datetime",
  "gender": "string",
  "pronouns": "string",
  "originPlace": "string",
  "currentEra": "string",
  "species": "string",
  "status": "draft|active",
  "description": "string",
  "coverImageUrl": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "slug": "string",
  "visibility": "private",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### GET /api/oasisbios/{id}

Get a specific OasisBio by ID.

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "slug": "string",
  "tagline": "string",
  "summary": "string",
  "identityMode": "string",
  "birthDate": "datetime",
  "gender": "string",
  "pronouns": "string",
  "originPlace": "string",
  "currentEra": "string",
  "species": "string",
  "status": "string",
  "description": "string",
  "coverImageUrl": "string",
  "visibility": "string",
  "featured": false,
  "publishedAt": "datetime",
  "createdAt": "datetime",
  "updatedAt": "datetime",
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

**Request Body:** (any fields from the OasisBio model)
```json
{
  "title": "string",
  "tagline": "string",
  "visibility": "private|public"
}
```

**Response:** Same as GET /api/oasisbios/{id}

### DELETE /api/oasisbios/{id}

Delete an OasisBio.

**Response:**
```json
{
  "ok": true
}
```

### POST /api/oasisbios/{id}/publish

Publish an OasisBio.

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
  "slug": "string",
  "publishedAt": "datetime",
  "visibility": "public"
}
```

### DELETE /api/oasisbios/{id}/publish

Unpublish an OasisBio.

**Response:**
```json
{
  "ok": true
}
```

### GET /api/oasisbios/public

List public OasisBios (no authentication required).

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "tagline": "string",
      "identityMode": "string",
      "currentEra": "string",
      "coverImageUrl": "string"
    }
  ]
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
      "id": "string",
      "name": "string",
      "category": "string",
      "level": 1,
      "description": "string",
      "sourceType": "custom|official"
    }
  ]
}
```

### POST /api/oasisbios/{id}/abilities

Create a new ability.

**Request Body:**
```json
{
  "name": "string (required)",
  "category": "string (required)",
  "level": 1-5,
  "description": "string",
  "relatedWorldId": "string",
  "relatedEraId": "string"
}
```

### PUT /api/abilities/{id}

Update an ability.

**Request Body:** Same as POST, all fields optional.

### DELETE /api/abilities/{id}

Delete an ability.

---

## World Endpoints

### GET /api/oasisbios/{id}/worlds

List worlds for an OasisBio.

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "summary": "string",
      "visibility": "private|public",
      "timeSetting": "string",
      "geography": "string",
      "physicsRules": "string",
      "socialStructure": "string",
      "majorConflict": "string",
      "timeline": "string",
      "rules": "string",
      "factions": "string"
    }
  ]
}
```

### POST /api/oasisbios/{id}/worlds

Create a new world.

**Request Body:**
```json
{
  "name": "string (required)",
  "summary": "string (required)",
  "timeSetting": "string",
  "geography": "string",
  "physicsRules": "string",
  "socialStructure": "string",
  "majorConflict": "string",
  "timeline": "string",
  "rules": "string",
  "factions": "string",
  "visibility": "private|public"
}
```

### GET /api/worlds/{id}

Get a world by ID.

**Response:** Same as world object in list response.

### PUT /api/worlds/{id}

Update a world.

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
      "id": "string",
      "title": "string",
      "slug": "string",
      "content": "string",
      "folderPath": "string",
      "status": "draft|published",
      "version": 1
    }
  ]
}
```

### POST /api/oasisbios/{id}/dcos

Create a DCOS file.

**Request Body:**
```json
{
  "title": "string (required)",
  "content": "string (required)",
  "slug": "string",
  "folderPath": "string",
  "status": "draft|published",
  "eraId": "string"
}
```

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
  "url": "string (required)",
  "title": "string (required)",
  "description": "string",
  "sourceType": "article|video|website",
  "provider": "string",
  "coverImage": "string",
  "eraId": "string",
  "worldId": "string",
  "tags": "string"
}
```

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
  "name": "string (required)",
  "eraType": "past|present|future|alternate|worldbound",
  "description": "string",
  "startYear": "number",
  "endYear": "number"
}
```

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
    "id": "string",
    "name": "string",
    "email": "string"
  },
  "profile": {
    "id": "string",
    "username": "string",
    "displayName": "string",
    "avatarUrl": "string",
    "bio": "string",
    "website": "string",
    "locale": "string",
    "defaultLanguage": "string"
  }
}
```

### PUT /api/profile

Update profile.

**Request Body:**
```json
{
  "username": "string",
  "displayName": "string",
  "avatarUrl": "string",
  "bio": "string",
  "website": "string",
  "locale": "string",
  "defaultLanguage": "string"
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
      "id": "string",
      "type": "create|update|delete",
      "title": "string",
      "slug": "string",
      "timestamp": "datetime"
    }
  ]
}
```
