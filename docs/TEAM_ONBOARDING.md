# OasisBio Team Onboarding Guide

Welcome to the OasisBio engineering team! This guide will help you get up to speed quickly.

---

## Table of Contents

1. [Welcome & Orientation](#welcome--orientation)
2. [Repository Overview](#repository-overview)
3. [Development Setup](#development-setup)
4. [Team Structure](#team-structure)
5. [Code Standards](#code-standards)
6. [Workflow](#workflow)
7. [Getting Help](#getting-help)

---

## Welcome & Orientation

### First Day Checklist

- [ ] Read [OASISBIO_RELATIONSHIP.md](OASISBIO_RELATIONSHIP.md) - Understand how this repo fits in
- [ ] Read [README.md](../README.md) - Project overview
- [ ] Read [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [ ] Get GitHub repository access
- [ ] Set up development environment
- [ ] Schedule 1:1 with team lead
- [ ] Join relevant Slack/Teams channels

### Key Concepts to Understand First

| Concept | Explanation |
|---------|-------------|
| **OasisBio** | The product/brand name |
| **OasisBio-Ecosystem** | This monorepo with all code |
| **Monorepo** | Single repo with multiple packages/apps |
| **pnpm** | Package manager we use (not npm/yarn) |

---

## Repository Overview

### Repository Layout

```
OasisBio-Ecosystem/
├── apps/                      # Applications (one per platform)
│   ├── desktop/               # Desktop app (Electron + React)
│   ├── android/               # Android app (Kotlin + Compose)
│   ├── ios/                   # iOS app (SwiftUI)
│   ├── web/                   # Web app (future)
│   └── flutter/               # Flutter prototype (deprecated)
├── packages/                  # Shared packages
│   ├── common-core/           # Core types/enums/models
│   ├── common-utils/          # Utility functions
│   ├── common-auth/           # Auth types/errors
│   ├── common-api/            # API client
│   ├── common-validators/     # Validation schemas
│   └── common-services/       # Shared business logic
├── docs/                      # Documentation
├── .github/                   # CI/CD workflows
└── README.md                  # Start here!
```

### What's in Each App?

#### Desktop App (`apps/desktop/`)
- Electron 28+
- React 18+
- TypeScript (strict)
- Vite
- Tailwind CSS

#### Android App (`apps/android/`)
- Kotlin 1.9+
- Jetpack Compose
- Hilt (DI)
- Retrofit (Networking)
- Coroutines

#### iOS App (`apps/ios/`)
- Swift 6+
- SwiftUI
- URLSession (Networking)
- Swift Concurrency

---

## Development Setup

### Prerequisites

Make sure you have installed:

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 20+ | Desktop/web development |
| **pnpm** | 9+ | Monorepo package manager |
| **JDK** | 17+ | Android development |
| **Android Studio** | Latest | Android development |
| **Xcode** | 15+ | iOS development |
| **Git** | Latest | Version control |

### First-Time Setup

```bash
# 1. Clone the repo
git clone https://github.com/zbbsdsb/OasisBio-Ecosystem.git
cd OasisBio-Ecosystem

# 2. Install dependencies (uses pnpm workspaces)
pnpm install

# 3. Build all packages
pnpm build

# 4. You're ready! Pick an app to work on...
cd apps/desktop
pnpm dev
```

### Environment Setup

Copy the example env file:

```bash
cp apps/desktop/.env.example apps/desktop/.env
```

Edit with your API endpoints (ask team for details).

### Working on Shared Packages

When modifying packages:

```bash
# Build a specific package
pnpm --filter @oasisbio/common-core build

# Watch mode (rebuilds on changes)
pnpm --filter @oasisbio/common-core dev

# Run tests
pnpm --filter @oasisbio/common-core test
```

---

## Team Structure

### Core Teams

| Team | Focus | Lead | Members |
|------|-------|------|---------|
| **Core Team** | Architecture, shared packages | @oasisbio/core | 3-4 |
| **Desktop Team** | Electron/React app | @oasisbio/desktop | 2-3 |
| **Android Team** | Kotlin/Compose app | @oasisbio/android | 2-3 |
| **iOS Team** | SwiftUI app | @oasisbio/ios | 2-3 |

### How We Collaborate

- **Daily Standup**: 10:00 AM (15-30 min)
- **Sprint Planning**: Every 2 weeks (Monday)
- **Code Review**: Mandatory for all PRs
- **Pair Programming**: As needed, especially for complex features

### Communication Channels

| Platform | Channel | Purpose |
|----------|---------|---------|
| **Slack** | `#oasisbio-eng` | General engineering |
| **Slack** | `#oasisbio-desktop` | Desktop team |
| **Slack** | `#oasisbio-mobile` | Android/iOS team |
| **GitHub** | Issues/PRs | Async discussions |
| **Notion** | Documentation | Planning & docs |

---

## Code Standards

### TypeScript/JavaScript Guidelines

1. **Strict Mode Always**: Use TypeScript strict mode
2. **Type Safety**: Avoid `any`, prefer `unknown`
3. **Functional**: Prefer pure functions
4. **Immutability**: Don't mutate state
5. **Error Handling**: Use Result type or try/catch

```typescript
// Good!
function processData(data: Input): Result<Output, Error> {
  try {
    const result = transform(data);
    return ok(result);
  } catch (e) {
    return err(new Error('Failed to process'));
  }
}
```

### Git & Commit Guidelines

- **Branch Naming**: `feature/description` or `fix/description`
- **Commit Messages**: Follow Conventional Commits
  ```
  feat: add search functionality to identity list
  fix: resolve memory leak in API client
  docs: update onboarding guide
  ```
- **PRs**: Keep them small, focused, with clear description

### Code Review Process

1. Submit PR with clear description
2. Request review from at least one teammate
3. Address all comments
4. Squash & merge after approval

---

## Workflow

### Sprint Workflow

1. **Backlog Refinement** - Before sprint starts
2. **Sprint Planning** - Pick tasks from backlog
3. **Daily Standup** - Quick check-in
4. **Development** - Work on tasks
5. **Code Review** - PRs
6. **Sprint Review** - Demo work
7. **Retrospective** - Improve process

### Starting a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/feature-name

# 2. Write code!

# 3. Commit changes
git add .
git commit -m "feat: add feature description"

# 4. Push and open PR
git push origin feature/feature-name
```

### Testing

- **Unit Tests**: Jest for TypeScript, XCTest for iOS, JUnit for Android
- **Integration Tests**: For API interactions
- **E2E Tests**: Coming soon

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @oasisbio/common-core test

# Run with coverage
pnpm test:coverage
```

---

## Getting Help

### Common Resources

| Resource | Purpose |
|----------|---------|
| [README.md](../README.md) | Project overview |
| [OASISBIO_RELATIONSHIP.md](OASISBIO_RELATIONSHIP.md) | Repo vs product explained |
| [architecture.md](architecture.md) | System architecture |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guidelines |

### Who to Ask

| Topic | Person/Team |
|-------|-------------|
| **Architecture** | Core Team (@oasisbio/core) |
| **Desktop** | Desktop Team (@oasisbio/desktop) |
| **Android** | Android Team (@oasisbio/android) |
| **iOS** | iOS Team (@oasisbio/ios) |
| **Backend** | Backend Team (separate repo) |
| **Design/UX** | Design Team |

### Getting Unstuck

1. Check documentation first
2. Search existing issues/PRs
3. Ask in team channel
4. Schedule pairing session

---

## Your First Week

### Day 1-2

- [ ] Complete this onboarding checklist
- [ ] Get development environment set up
- [ ] Build and run each app locally
- [ ] Read all docs in `docs/`

### Day 3-5

- [ ] Pick a "good first issue" (see GitHub)
- [ ] Pair with a team member
- [ ] Make your first PR!

---

## Additional Resources

- [API Reference](api-reference.md)
- [Ecosystem Roadmap](ecosystem-roadmap.md)
- [Architecture Overview](architecture.md)
- [Types Reference](types-reference.md)

---

**Welcome to the team!** 🚀

We're glad you're here. Don't hesitate to ask questions - we've all been in your shoes before.
