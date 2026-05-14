# OasisBio Desktop

Cross-era digital identity system desktop client.

## Features

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

- ✅ **Performance Optimization**
  - Route lazy loading
  - Component on-demand loading
  - Smooth loading states

### AI Assistants (New)

- ✅ **Deo - Technical Assistant**
  - Green dinosaur mascot
  - Expert in programming, system architecture, debugging
  - Clear and concise code examples

- ✅ **Dia - Creative Partner**
  - Pink dinosaur mascot
  - Creative writing, brainstorming, story ideation
  - Rich emotional and visual expression

- ✅ **Session Management**
  - Create new sessions with different agents
  - Rename sessions
  - Delete sessions
  - Session history persistence with localStorage
  - Chat history auto-save

### World Builder 2.0 (New)

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

### OAuth Integration (New)

- ✅ **OAuth 2.0 Support**
  - Third-party application authorization
  - Secure token management
  - Application registration system

## Tech Stack

- **Electron** - Cross-platform desktop application framework
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation frontend build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Routing management
- **Lucide React** - Icon library

## Development Environment Requirements

- Node.js >= 20.0.0
- pnpm >= 9.0.0

## Installation & Running

### 1. Install pnpm

If you haven't installed pnpm yet:

```bash
npm install -g pnpm
```

### 2. Install Dependencies

Run in the project root directory:

```bash
pnpm install
```

### 3. Build Shared Packages

Build all shared packages in the project root:

```bash
pnpm build
```

Or build individual packages:

```bash
cd packages/common-core
pnpm build

cd ../common-api
pnpm build

cd ../common-auth
pnpm build
```

### 4. Run in Development Mode

Run in the apps/desktop directory:

```bash
cd apps/desktop
pnpm dev
```

### 5. Build for Production

```bash
pnpm build
```

This will build the application and generate distributable files in the `release/` directory.

## Project Structure

```
apps/desktop/
├── electron/
│   ├── main.ts          # Electron main process
│   └── preload.ts       # Preload script
├── src/
│   ├── components/      # Component library
│   │   ├── ui/      # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Spinner.tsx
│   │   └── layout/    # Layout components
│   │       ├── AppLayout.tsx
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── pages/         # Page components
│   │   ├── WelcomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── VerifyPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── IdentityListPage.tsx
│   │   ├── IdentityDetailPage.tsx
│   │   ├── IdentityFormPage.tsx
│   │   ├── WorldListPage.tsx
│   │   ├── AbilityListPage.tsx
│   │   └── SettingsPage.tsx
│   ├── contexts/      # Contexts
│   │   └── ThemeContext.tsx
│   ├── hooks/         # Custom hooks
│   │   ├── useAuth.tsx
│   │   └── useAssistantSessions.ts
│   ├── services/      # Service layer
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── assistantService.ts
│   │   └── cache.ts
│   ├── types/         # Type definitions
│   │   └── assistant.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
└── electron-builder.json # Electron build configuration
```

## Shared Package Integration

This project integrates the following OasisBio shared packages:

- `@oasisbio/common-core` - Core types, enums, constants, and utilities
- `@oasisbio/common-api` - API client
- `@oasisbio/common-auth` - Authentication utilities and types

These packages are linked via pnpm workspace and can be updated in real-time during development.

## Routing

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
| `/abilities` | AbilityListPage | Ability list |
| `/settings` | SettingsPage | Settings page |

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm lint` | Lint code |
| `pnpm test` | Run tests |

## Usage Examples

### AI Assistant Usage

```typescript
import { useAssistantSessions } from './hooks/useAssistantSessions';

function ChatComponent() {
  const { sessions, createSession, deleteSession, renameSession } = useAssistantSessions();

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

### World Builder 2.0 Usage

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
        {/* ... other modules */}
      </div>
    </div>
  );
}
```

### Chat History Persistence

```typescript
const { 
  getSessionHistory, 
  saveSessionHistory, 
  clearSessionHistory 
} = useAssistantSessions();

// Load chat history
const history = getSessionHistory(sessionId);

// Save new messages
saveSessionHistory(sessionId, [...history, newMessage]);

// Clear chat history
clearSessionHistory(sessionId);
```

## Packaging

### Windows Packaging

Using electron-builder configured for Windows NSIS installer:

```bash
pnpm build
```

This will generate in the `release/` directory:
- `OasisBio Desktop Setup x.x.x.exe` - NSIS installer
- `OasisBio Desktop-x.x.x-win.zip` - Portable archive

### Configuration Options

Customize in `electron-builder.json`:
- Application icon
- Installer options
- File associations
- And more

## Development Notes

1. Ensure shared packages are rebuilt after modifications
2. TypeScript is configured in strict mode for type safety
3. Use Tailwind CSS for styling
4. Use React Router for navigation
5. Use lazy loading to optimize application performance

## Theme System

The app supports dark and light themes:
- Default dark mode
- Theme toggle button in sidebar footer
- Theme preference saved to localStorage

## Architecture Highlights

### Module System

World Builder 2.0 uses a modular architecture:
- Each module is independent and self-contained
- Modules can be expanded and replaced easily
- Completion scores calculated per-module

### Session Management

- Automatic session persistence to localStorage
- Offline-capable with cached sessions
- Merge local and remote session data

### Error Handling

- All async operations wrapped in try-catch
- Graceful degradation with cached data
- User-friendly error messages

### Performance

- React hooks optimized with useMemo and useCallback
- Route and component lazy loading
- Efficient re-render prevention
