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

Create a