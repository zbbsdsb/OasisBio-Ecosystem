# OasisBio System Architecture

## Overview

OasisBio is a cross-era digital identity system designed to manage and explore digital identities across different time periods and realities.

## Architecture Style

The application follows a **Clean Architecture** pattern with the following layers:

- **Presentation Layer**: UI components and ViewModels
- **Domain Layer**: Use cases and domain models
- **Data Layer**: Repositories, API clients, and local storage

## Module Structure

```
com.oasisbio.app/
├── data/                  # Data layer
│   ├── remote/           # API clients (Retrofit, Supabase)
│   ├── local/            # Local storage (DataStore)
│   └── repository/       # Repository implementations
├── domain/               # Domain layer
│   ├── model/            # Data models
│   ├── usecase/          # Use cases
│   └── repository/       # Repository interfaces
├── presentation/         # Presentation layer
│   ├── ui/              # Composables & screens
│   ├── viewmodel/       # ViewModels
│   └── navigation/      # Navigation components
└── di/                  # Dependency injection (Dagger Hilt)
```

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │  Screens │→→│ ViewModel│→→│      Navigation          │  │
│  └──────────┘  └──────────┘  └──────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Use Cases                               │   │
│  │  • SignInWithOtp • VerifyOtp • SignOut             │   │
│  │  • GetAllIdentities • GetIdentityById              │   │
│  │  • CreateIdentity • UpdateIdentity • DeleteIdentity│   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  ┌──────────────┐     ┌──────────────┐     ┌───────────┐   │
│  │ AuthRepoImpl │←→→→│ IdentityRepo │←→→→│   API      │   │
│  └──────────────┘     └──────────────┘     │  Client   │   │
│         │                                     └────┬────┘   │
│         ▼                                          │        │
│  ┌──────────────┐                                  │        │
│  │ AuthDataStore│                                  │        │
│  └──────────────┘                          ┌───────┴───────┐│
│                                            │    Supabase   ││
│                                            │      API      ││
│                                            └───────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow

1. User enters email on Login/Register screen
2. ViewModel calls `SignInWithOtpUseCase`
3. Use case delegates to `AuthRepository`
4. Repository uses Supabase Auth to send OTP
5. User enters OTP
6. ViewModel calls `VerifyOtpUseCase`
7. Repository verifies OTP and stores session
8. On success, navigate to Identity List screen

### Identity CRUD Flow

1. User interacts with UI to perform action
2. ViewModel calls appropriate Use Case
3. Use Case delegates to `IdentityRepository`
4. Repository makes API calls via `OasisBioApi`
5. API response is returned and UI is updated

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Language | Kotlin | 1.9+ |
| UI Framework | Jetpack Compose | 1.6+ |
| Network | Retrofit + OkHttp | 2.9+ |
| JSON | Kotlinx Serialization | 1.6+ |
| Navigation | AndroidX Navigation Compose | 2.7+ |
| State Management | ViewModel + Flow | - |
| Local Storage | DataStore | - |
| DI | Dagger Hilt | 2.51+ |
| Auth | Supabase Auth | 1.15+ |
| Logging | Timber | 5.0+ |

## Security Considerations

1. **Authentication**: JWT tokens stored securely in DataStore
2. **HTTPS**: All API communications use HTTPS
3. **Input Validation**: All inputs validated before API calls
4. **Error Handling**: Proper error handling to avoid info leakage
5. **Build Config**: Separate debug/release configurations

## Future Considerations

1. **Offline Support**: Add Room database for offline data persistence
2. **Background Sync**: Implement WorkManager for background sync
3. **Push Notifications**: Integrate Firebase Cloud Messaging
4. **Biometric Authentication**: Add biometric login support