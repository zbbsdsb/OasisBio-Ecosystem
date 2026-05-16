# OasisBio Ecosystem Repository & OasisBio Relationship

## Overview

This document explains the relationship between the **OasisBio-Ecosystem** repository and **OasisBio** - the core product and brand. It serves as a reference for team onboarding and helps maintain clarity about the project structure.

---

## Table of Contents

1. [What is OasisBio?](#what-is-oasisbio)
2. [What is OasisBio-Ecosystem?](#what-is-oasisbio-ecosystem)
3. [Repository Structure & Purpose](#repository-structure--purpose)
4. [How They Connect](#how-they-connect)
5. [Responsibility Mapping](#responsibility-mapping)
6. [Onboarding Guide](#onboarding-guide)
7. [Architecture Diagram](#architecture-diagram)

---

## What is OasisBio?

**OasisBio** is the flagship product and brand name for the **cross-era digital identity management system** developed by Oasis Company. It's the primary user-facing platform with these core capabilities:

### Core Features of OasisBio
- 🔐 **Digital Identity Management** - Create, manage, and share digital identities
- 🤖 **AI Assistants** - Deo (Technical) & Dia (Creative) AI companions
- 🌍 **World Builder 2.0** - Six-module world-building system
- 🔗 **OAuth 2.0** - Third-party application authorization
- 📱 **Multi-Platform** - Desktop, Android, iOS, Web

### Brand Identity
- **Product Name**: OasisBio
- **Tagline**: "Cross-era Digital Identity System"
- **Mission**: Empower creators to build and manage digital identities across eras
- **Visual Identity**: Green/teal color scheme, organic motifs

---

## What is OasisBio-Ecosystem?

**OasisBio-Ecosystem** is the **monorepo repository** that contains all code, shared libraries, and platform-specific applications that power the OasisBio product and other Oasis Company products.

Think of it as:
```
OasisBio (Product/Brand)
├── powered by →
└── OasisBio-Ecosystem (Code Repository/Infrastructure)
    ├── Shared Packages
    ├── Desktop App
    ├── Android App
    ├── iOS App
    └── Web App
```

### Key Components in this Repository

| Component | Type | Description |
|-----------|------|-------------|
| `@oasisbio/common-*` | Shared Packages | Reusable TypeScript libraries used across all platforms |
| `apps/desktop/` | Desktop App | Electron + React desktop client |
| `apps/android/` | Android App | Kotlin + Jetpack Compose native app |
| `apps/ios/` | iOS App | SwiftUI native app |
| `apps/web/` | Web App | Web client (future) |
| `apps/flutter/` | Flutter App | Cross-platform prototype |

---

## Repository Structure & Purpose

```
OasisBio-Ecosystem/
├── packages/                    ← SHARED INFRASTRUCTURE (Oasis Company Wide)
│   ├── common-core/            # Core types, enums, models
│   ├── common-utils/           # Utility functions
│   ├── common-auth/            # Authentication types
│   ├── common-api/             # API client interfaces
│   ├── common-validators/      # Validation schemas
│   ├── common-services/        # Shared business logic
│   ├── design-system/          # UI components (WIP)
│   └── identity-core/          # Identity management (WIP)
│
├── apps/                        ← OASISBIO PRODUCT APPLICATIONS
│   ├── desktop/                # OasisBio Desktop App
│   ├── android/                # OasisBio Android App
│   ├── ios/                    # OasisBio iOS App
│   ├── web/                    # OasisBio Web App (future)
│   └── flutter/                # Flutter prototype (deprecated)
│
├── docs/                        ← DOCUMENTATION
│   ├── architecture.md
│   ├── api-reference.md
│   ├── ecosystem-roadmap.md
│   └── OASISBIO_RELATIONSHIP.md # ← This file
│
└── .github/                     ← CI/CD & Workflows
    ├── workflows/
    └── ISSUE_TEMPLATE/
```

---

## How They Connect

### Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     OASIS COMPANY                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         OASISBIO PRODUCT (User Facing)                │ │
│  │  ┌──────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │ │
│  │  │ Desktop  │  │ Android │  │   iOS   │  │   Web   │ │ │
│  │  └─────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘ │ │
│  └────────┼──────────────────┼─────────────┼────────────┼───┘ │
│           │                  │             │            │
│           └──────────────────┴─────────────┴────────────┘
│                              │
│                              ▼
│  ┌───────────────────────────────────────────────────────┐
│  │      OASISBIO-ECOSYSTEM REPOSITORY (Code)             │
│  │  ┌──────────────────────────────────────────────────┐│
│  │  │ Shared Packages (@oasisbio/*)                    ││
│  │  ├──────────────────────────────────────────────────┤│
│  │  │ common-core | common-utils | common-api | ...    ││
│  │  └──────────────────────────────────────────────────┘│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  │ Desktop App  │  │ Android App  │  │   iOS App   ││
│  │  │ (Electron)   │  │ (Kotlin)     │  │  (SwiftUI)  ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘│
│  └───────────────────────────────────────────────────────┘
│                              │
│                              ▼
│  ┌───────────────────────────────────────────────────────┐
│  │          BACKEND API & INFRASTRUCTURE                  │
│  │  (Separate Repository - not in this monorepo)         │
│  └───────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User** → Interacts with **OasisBio App** (Desktop/Android/iOS)
2. **App** → Uses code from **OasisBio-Ecosystem** repo
3. **App** → Makes API calls to **Backend API** (separate repo)
4. **Backend** → Stores data in database, manages auth, etc.

---

## Responsibility Mapping

### What Lives Here? (OasisBio-Ecosystem Repo)

✅ **All frontend application code**
- Desktop (Electron + React)
- Android (Kotlin + Compose)
- iOS (SwiftUI)

✅ **All shared TypeScript packages**
- `@oasisbio/common-core`
- `@oasisbio/common-utils`
- `@oasisbio/common-auth`
- `@oasisbio/common-api`
- `@oasisbio/common-validators`
- `@oasisbio/common-services`

✅ **All UI components**
- React components
- Compose components
- SwiftUI components

✅ **All client-side business logic**
- API clients
- State management
- Validation

✅ **All documentation**
- API references
- Architecture docs
- Guides

### What Doesn't Live Here?

❌ **Backend API** (separate repository)
- Database models
- API endpoints
- Server-side logic

❌ **Infrastructure** (separate)
- Terraform
- Kubernetes configs
- Cloud deployment

❌ **Design assets** (separate)
- Figma files
- Brand guidelines
- Marketing materials

---

## Onboarding Guide

### New Team Member Checklist

- [ ] Read this document
- [ ] Understand the difference between OasisBio (brand/product) and OasisBio-Ecosystem (repo)
- [ ] Clone the repository: `git clone https://github.com/zbbsdsb/OasisBio-Ecosystem.git`
- [ ] Set up development environment (see [README.md](../README.md))
- [ ] Review the architecture in [architecture.md](architecture.md)
- [ ] Familiarize with shared packages in `packages/`
- [ ] Pick a platform to work on (Desktop/Android/iOS)
- [ ] Join the relevant team channel

### What You Need to Know

1. **This is a monorepo** - Contains multiple apps and packages
2. **Use pnpm** - Package manager for monorepo
3. **TypeScript first** - Strict mode required
4. **Cross-platform consistency** - APIs should work same across platforms
5. **Shared package versioning** - Packages are versioned together

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER LAYER                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Desktop   │ │   Android   │ │     iOS     │          │
│  │             │ │             │ │             │          │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘          │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER (THIS REPO)                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │           SHARED PACKAGES (@oasisbio/*)              │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │ common-core  | common-utils | common-auth      │ │ │
│  │  │ common-api   | common-validators | services    │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐              │
│  │  Desktop  │ │  Android  │ │    iOS    │              │
│  │   App     │ │   App     │ │   App     │              │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘              │
└──────────────────────────────────┼─────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND LAYER (SEPARATE)                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │            OasisBio Backend API                      │ │
│  │  (Authentication, Database, Business Logic)         │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Other Oasis Company Products Powered by This Repo

The OasisBio-Ecosystem repository also powers other products:

| Product | Description | Status |
|---------|-------------|--------|
| **MuseRock** | AI-powered creative collaboration platform | Active |
| **R U Socrates** | Transparent AI research engine | Active |
| **QueueDesk** | AI-first internal service desk | Active |
| **pwl-reading** | AI-native reading companion | Active |

All of these share the same foundational packages from this monorepo.

---

## Key Contacts & Teams

| Team | Responsibility | GitHub Team |
|------|----------------|-------------|
| **Core Team** | Architecture, shared packages | @oasisbio/core |
| **Desktop Team** | Electron/React app | @oasisbio/desktop |
| **Android Team** | Kotlin/Compose app | @oasisbio/android |
| **iOS Team** | SwiftUI app | @oasisbio/ios |
| **Web Team** | Web app (future) | @oasisbio/web |

---

## FAQ

### Q: Is "OasisBio" the same as "OasisBio-Ecosystem"?

**A**: No! 
- **OasisBio** = Product/Brand name
- **OasisBio-Ecosystem** = Code repository that powers OasisBio and other products

### Q: Can I use the packages for other projects?

**A**: Yes! The `@oasisbio/*` packages are designed to be reusable across Oasis Company products.

### Q: Where is the backend code?

**A**: In a separate, private repository. This repo is only for client-side code and shared packages.

### Q: How do I get access?

**A**: Contact your team lead or @oasisbio/ops for repository access.

---

## Update History

| Date | Author | Changes |
|------|--------|---------|
| 2024-05-16 | Core Team | Initial version |

---

**Maintained by**: Oasis Company Core Team  
**Last Updated**: May 2024
