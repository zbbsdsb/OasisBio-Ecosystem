# OasisBio Desktop

Cross-era digital identity system desktop client built with Electron and React.

---

## Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Routing](#-routing)
- [AI Assistants](#-ai-assistants)
- [World Builder 2.0](#-world-builder-20)
- [OAuth Integration](#-oauth-integration)
- [Testing](#-testing)
- [Performance Optimization](#-performance-optimization)
- [Error Handling](#-error-handling)
- [Packaging](#-packaging)

---

## ✨ Features

### Core Features

- ✅ **UI Shell & Navigation System**
  - Responsive sidebar navigation
  - Top navigation bar
  - Dark/light theme toggle
  - Complete application layout

- ✅ **Authentication System**
  - Welcome page
  - Email login
  - OTP verification
  - Automatic session management

- ✅ **Identity Management**
  - Identity list view
  - Identity detail page
  - Create and edit identities
  - Delete identity functionality

- ✅ **World & Ability Management**
  - World management page
  - Ability management page
  - Settings page

### AI Assistants

- ✅ **Deo - Technical Assistant**
  - Green dinosaur mascot
  - Expert in programming, system architecture, debugging
  - Clear and concise code examples
  - Real-time streaming responses

- ✅ **Dia - Creative Partner**
  - Pink dinosaur mascot
  - Creative writing, brainstorming, story ideation
  - Rich emotional and visual expression
  - Context-aware suggestions

- ✅ **Session Management**
  - Create new sessions with different agents
  - Rename sessions
  - Delete sessions
  - Session history persistence with localStorage
  - Chat history auto-save
  - Multi-session support

### World Builder 2.0

Six modular world-building components:

1. **Core Identity Module**
   - World name, summary, major conflict
   - Aesthetic keywords for visual direction

2. **Time Structure Module**
   - Time setting, timeline visualization
   - Temporal rules and time-related mechanics

3. **Space Structure Module**
   - Geography and physical locations
   - Physics rules and natural phenomena

4. **Society Module**
   - Social structures, factions, cultures
   - Languages, religions, and belief systems

5. **Rules Module**
   - World rules and limitations
   - Magic systems, technology levels
   - Natural laws governing the world

6. **Content Module**
   - Characters, events, and lore
   - Rich narrative content

- ✅ **Completion Score Calculation**
  - Track world-building progress
  - Module-by-module breakdown
  - Visual progress indicators

### OAuth 2.0 Integration

- ✅ **OAuth 2.0 Support**
  - Third-party application authorization
  - Secure token management
  - Application registration system
  - Scope-based permissions

---

## 🔧 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Electron** | Cross-platform desktop application framework |
| **React 18** | UI framework |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Next-generation frontend build tool |
| **Tailwind CSS** | Utility-first CSS framework |
| **React Router** | Routing management |
| **Lucide React** | Icon library |
| **Jest** | Testing framework |
| **MSW** | API mocking for tests |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0

### Installation

```bash
# Install pnpm (if not installed)
npm install -g pnpm

# Clone and install dependencies
git clone https://github.com/zbbsdsb/OasisBio-Ecosystem.git
cd OasisBio-Ecosystem
pnpm install

# Build shared packages
pnpm build
```

### Development

```bash
# Navigate to desktop app
cd apps/desktop

# Run in development mode
pnpm dev
```

### Production Build

```bash
cd apps/desktop
pnpm build
```

Output files in `release/`:
- `OasisBio Desktop Setup x.x.x.exe` - NSIS installer
- `OasisBio Desktop-x.x.x-win.zip` - Portable archive

---

## 📁 Project Structure

```
apps/desktop/
├── electron/
│   ├── main.ts          # Electron main process
│   └── preload.ts       # Preload script (context bridge)
├── src/
│   ├── __tests__/       # Test files
│   │   ├── integration/ # Integration tests
│   │   ├── mocks/       # MSW handlers
│   │   └── test-utils.tsx
│   ├── components/      # Component library
│   │   ├── assistant/   # AI assistant components
│   │   │   ├── AgentSelector.tsx
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── PermissionManager.tsx
│   │   │   └── SettingsPanel.tsx
│   │   ├── auth/        # Authentication components
│   │   │   └── OAuthButtons.tsx
│   │   ├── layout/      # Layout components
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── ui/          # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── OfflineIndicator.tsx
│   │   │   ├── PerformanceMonitor.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Textarea.tsx
│   │   │   └── Toast.tsx
│   │   └── world/       # World builder components
│   │       ├── steps/   # Wizard steps
│   │       ├── CharacterSection.tsx
│   │       ├── CreateWorldCard.tsx
│   │       ├── ModuleSection.tsx
│   │       ├── StepWizard.tsx
│   │       ├── WizardProgress.tsx
│   │       └── WorldCard.tsx
│   ├── contexts/        # React contexts
│   │   └── ThemeContext.tsx
│   ├── hooks/           # Custom hooks
│   │   ├── useAssistant.ts
│   │   ├── useAssistantSessions.ts
│   │   ├── useAuth.tsx
│   │   ├── useCompletionScore.ts
│   │   ├── useDataLoader.ts
│   │   ├── useLogger.ts
│   │   ├── usePerformance.ts
│   │   └── useWorldBuilder.ts
│   ├── pages/           # Page components
│   │   ├── AbilityListPage.tsx
│   │   ├── AssistantPage.tsx
│   │   ├── AssistantSettingsPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── DeveloperAppsPage.tsx
│   │   ├── IdentityDetailPage.tsx
│   │   ├── IdentityFormPage.tsx
│   │   ├── IdentityListPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── OAuthDocsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── VerifyPage.tsx
│   │   ├── WelcomePage.tsx
│   │   ├── WorldBuilderPage.tsx
│   │   ├── WorldDetailPage.tsx
│   │   └── WorldListPage.tsx
│   ├── services/        # Service layer
│   │   ├── api.ts
│   │   ├── assistantService.ts
│   │   ├── auth.ts
│   │   ├── cache.ts
│   │   ├── oauthService.ts
│   │   └── offlineService.ts
│   ├── types/           # Type definitions
│   │   ├── assistant.ts
│   │   ├── oauth.ts
│   │   └── world-builder.ts
│   ├── utils/           # Utility functions
│   │   ├── devtools.ts
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   ├── performance.ts
│   │   ├── requestCancellation.ts
│   │   └── requestDedup.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
├── electron-builder.json # Electron build configuration
├── jest.config.js       # Jest configuration
├── TESTING.md           # Testing guide
├── PERFORMANCE.md       # Performance guide
└── ERROR_HANDLING.md    # Error handling guide
```

---

## 🔀 Routing

| Path | Page | Description |
|------|------|-------------|
| `/` | WelcomePage | Welcome page |
| `/login` | LoginPage | Login page |
| `/verify` | VerifyPage | OTP verification |
| `/dashboard` | DashboardPage | Dashboard |
| `/identities` | IdentityListPage | Identity list |
| `/identities/new` | IdentityFormPage | Create identity |
| `/identities/:id` | IdentityDetailPage | Identity detail |
| `/identities/:id/edit` | IdentityFormPage | Edit identity |
| `/worlds` | WorldListPage | World list |
| `/worlds/builder` | WorldBuilderPage | World builder |
| `/worlds/:id` | WorldDetailPage | World detail |
| `/abilities` | AbilityListPage | Ability list |
| `/assistant` | AssistantPage | AI assistant |
| `/assistant/settings` | AssistantSettingsPage | Assistant settings |
| `/developer/apps` | DeveloperAppsPage | OAuth apps |
| `/developer/docs` | OAuthDocsPage | OAuth docs |
| `/settings` | SettingsPage | Settings page |

---

## 🤖 AI Assistants

### Usage

```typescript
import { useAssistantSessions } from './hooks/useAssistantSessions';

function ChatComponent() {
  const { 
    sessions, 
    createSession, 
    deleteSession, 
    renameSession,
    getSessionHistory,
    saveSessionHistory,
    clearSessionHistory
  } = useAssistantSessions();

  const handleNewSession = async () => {
    const sessionId = await createSession('deo'); // or 'dia'
    console.log('Created session:', sessionId);
  };

  return (
    <div>
      {/* Session list */}
    </div>
  );
}
```

### Agent Types

| Agent | Description | Capabilities |
|-------|-------------|--------------|
| `deo` | Technical Assistant | Programming, debugging, architecture, code review |
| `dia` | Creative Partner | Writing, brainstorming, story ideation, world-building |

### Features

- **Streaming responses**: Real-time message streaming
- **Context persistence**: Chat history saved to localStorage
- **Multi-session**: Multiple concurrent sessions
- **Permission management**: Control agent capabilities

---

## 🌍 World Builder 2.0

### Usage

```typescript
import { calculateWorldCompletionScore, type WorldItem } from '@oasisbio/common-core';

function WorldCard({ world }: { world: Partial<WorldItem> }) {
  const { score, breakdown } = calculateWorldCompletionScore(world);

  return (
    <div>
      <ProgressBar value={score} />
      <div>
        <span>Core Identity: {breakdown.coreIdentity}%</span>
        <span>Time Structure: {breakdown.timeStructure}%</span>
        <span>Space Structure: {breakdown.spaceStructure}%</span>
        <span>Society: {breakdown.society}%</span>
        <span>Rules: {breakdown.rules}%</span>
        <span>Content: {breakdown.content}%</span>
      </div>
    </div>
  );
}
```

### Module Scoring

| Module | Weight | Fields |
|--------|--------|--------|
| Core Identity | 25% | name, summary, majorConflict |
| Time Structure | 15% | timeSetting, timeline |
| Space Structure | 15% | geography, physicsRules |
| Society | 15% | socialStructure, factions |
| Rules | 15% | rules |
| Content | 15% | characters, events |

---

## 🔐 OAuth Integration

### Registering an Application

```typescript
import { oauthService } from './services/oauthService';

const app = await oauthService.registerApp({
  name: 'My Application',
  redirectUri: 'https://example.com/callback',
  scopes: ['read:profile', 'read:oasisbios'],
  description: 'Application description'
});
```

### Available Scopes

| Scope | Description |
|-------|-------------|
| `read:profile` | Read user profile |
| `write:profile` | Update user profile |
| `read:oasisbios` | Read user's OasisBios |
| `write:oasisbios` | Create/update OasisBios |
| `read:worlds` | Read world data |
| `write:worlds` | Create/update worlds |

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Test Structure

```
src/__tests__/
├── integration/
│   ├── assistant.test.tsx    # AI assistant integration
│   ├── auth.test.tsx         # Authentication flow
│   ├── oauth.test.tsx        # OAuth flow
│   └── world-builder.test.tsx # World builder flow
├── mocks/
│   ├── handlers.ts           # MSW handlers
│   └── server.ts             # Mock server setup
└── test-utils.tsx            # Test utilities
```

### Writing Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('handles clicks', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Coverage Targets

| Type | Target |
|------|--------|
| Unit tests | 70%+ |
| Integration tests | 50%+ |

See [TESTING.md](./TESTING.md) for detailed guide.

---

## ⚡ Performance Optimization

### Current Optimizations

| Optimization | Implementation |
|--------------|----------------|
| Component rendering | `React.memo()`, `useMemo()`, `useCallback()` |
| Data loading | Lazy loading, Suspense, LocalStorage caching |
| Code splitting | Route-based, Component-level |
| Request optimization | Deduplication, Cancellation |

### Performance Monitoring

```typescript
import { usePerformance } from './hooks/usePerformance';

function Component() {
  const { startMeasure, endMeasure } = usePerformance();

  useEffect(() => {
    startMeasure('data-load');
    loadData().then(() => endMeasure('data-load'));
  }, []);
}
```

### Bundle Analysis

```bash
pnpm build:analyze
```

### Performance Checklist

- [x] Components use memo() when appropriate
- [x] Expensive calculations use useMemo()
- [x] Event handlers use useCallback()
- [x] Large components are lazy-loaded
- [x] API responses cached
- [ ] Virtual scrolling for large lists (planned)
- [ ] Web Workers for heavy computation (planned)

See [PERFORMANCE.md](./PERFORMANCE.md) for detailed guide.

---

## ❌ Error Handling

### Error Types

```typescript
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TIMEOUT: 'TIMEOUT',
};
```

### Usage

```typescript
import { useToast } from './components/ui/Toast';
import { createError, OasisBioError } from './utils/errors';

function Component() {
  const { showToast } = useToast();

  const handleAction = async () => {
    try {
      await riskyOperation();
      showToast('Success!', 'success');
    } catch (error) {
      if (error instanceof OasisBioError) {
        showToast(error.message, 'error');
      }
    }
  };
}
```

### Retryable Operations

```typescript
import { createRetryHandler } from './utils/errors';

const fetchData = createRetryHandler(
  async () => api.getData(),
  3,    // max retries
  1000  // delay ms
);
```

### Error Boundary

```tsx
import { ErrorBoundary } from './components/ui/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Router />
    </ErrorBoundary>
  );
}
```

See [ERROR_HANDLING.md](./ERROR_HANDLING.md) for detailed guide.

---

## 📦 Packaging

### Windows

```bash
pnpm build
```

Output in `release/`:
- `OasisBio Desktop Setup x.x.x.exe` - NSIS installer
- `OasisBio Desktop-x.x.x-win.zip` - Portable archive

### Configuration

Edit `electron-builder.json`:

```json
{
  "appId": "com.oasisbio.desktop",
  "productName": "OasisBio Desktop",
  "win": {
    "target": ["nsis", "zip"],
    "icon": "assets/icon.ico"
  }
}
```

---

## 🎨 Theme System

- **Default**: Dark mode
- **Toggle**: Sidebar footer button
- **Persistence**: localStorage
- **CSS Variables**: Tailwind CSS dark mode

---

## 📚 Shared Package Integration

This project integrates OasisBio shared packages:

| Package | Usage |
|---------|-------|
| `@oasisbio/common-core` | Core types, enums, constants |
| `@oasisbio/common-api` | API client |
| `@oasisbio/common-auth` | Authentication utilities |

Packages are linked via pnpm workspace for real-time updates during development.

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm lint` | Lint code |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Watch mode tests |
| `pnpm test:coverage` | Coverage report |
| `pnpm build:analyze` | Analyze bundle size |

---

## 📝 Development Notes

1. **Shared packages**: Rebuild after modifications
2. **TypeScript**: Strict mode enabled
3. **Styling**: Tailwind CSS utility classes
4. **Navigation**: React Router v6
5. **Performance**: Lazy loading for optimization
6. **Testing**: Jest + React Testing Library + MSW

---

<p align="center">
  <strong>🏢 Oasis Company</strong><br>
  <a href="https://github.com/zbbsdsb">GitHub Organization</a>
</p>
