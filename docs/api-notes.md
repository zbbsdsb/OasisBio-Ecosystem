# OasisBio API Documentation

## Overview

This document describes the API endpoints used by the OasisBio ecosystem.

## Base URL

```
https://api.oasisbio.dev
```

## Authentication

All API endpoints require authentication via JWT token. The token should be included in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update user profile |

### Identity Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oasisbios` | List all identities |
| POST | `/api/oasisbios` | Create new identity |
| GET | `/api/oasisbios/{id}` | Get identity by ID |
| PUT | `/api/oasisbios/{id}` | Update identity |
| DELETE | `/api/oasisbios/{id}` | Delete identity |

## Data Models

### OasisBio Identity

```json
{
  "id": "string",
  "title": "string",
  "slug": "string",
  "tagline": "string",
  "summary": "string",
  "identityMode": "real|fictional|hybrid|future|alternate",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

### User Profile

```json
{
  "id": "string",
  "email": "string",
  "displayName": "string (optional)",
  "avatarUrl": "string (optional)"
}
```

## Error Handling

All errors return a JSON response with the following structure:

```json
{
  "error": "string",
  "message": "string"
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |