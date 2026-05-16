# OasisBio Android Application

A mobile application built with Jetpack Compose for the OasisBio ecosystem.

## Project Overview

OasisBio Android is a Kotlin-based mobile application that provides identity management and authentication features for the OasisBio platform. The app uses modern Android architecture with Hilt for dependency injection, Retrofit for networking, and Jetpack Compose for UI.

## Features

- **Authentication**: Email OTP-based authentication via Supabase
- **Identity Management**: User profile management and session handling
- **Modern UI**: Built with Jetpack Compose and Material Design 3
- **Secure Storage**: DataStore for preferences and secure token storage
- **Network Layer**: Retrofit with OkHttp interceptors for API communication

## Architecture

The project follows Clean Architecture principles:

```
├── domain/           # Business logic layer
│   ├── model/        # Domain models
│   └── repository/   # Repository interfaces
├── data/             # Data layer
│   ├── local/        # Local data sources
│   ├── remote/       # Remote API clients
│   └── repository/   # Repository implementations
├── presentation/     # UI layer
│   ├── navigation/   # Navigation routes
│   └── viewmodel/    # ViewModels
└── di/              # Dependency injection modules
```

## Tech Stack

- **Language**: Kotlin 1.9.x
- **UI Framework**: Jetpack Compose 1.6.x
- **Architecture**: MVVM + Clean Architecture
- **DI**: Hilt 2.51.1
- **Networking**: Retrofit 2.9.0 + OkHttp 4.12.0
- **Auth**: Supabase Auth 1.15.0
- **Storage**: DataStore Preferences
- **Async**: Kotlin Coroutines + Flow

## Development Setup

### Prerequisites

- Android Studio Hedgehog (2023.1.1) or newer
- JDK 17
- Android SDK 34
- Gradle 8.2+

### Configuration

1. Clone the repository
2. Open the project in Android Studio
3. Update build configuration with your Supabase credentials:
   ```groovy
   buildConfigField 'String', 'SUPABASE_URL', '"https://your-project.supabase.co"'
   buildConfigField 'String', 'SUPABASE_ANON_KEY', '"your-anon-key"'
   ```
4. Sync project with Gradle files
5. Build and run

### Build Commands

```bash
# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease

# Run unit tests
./gradlew test

# Run Android tests
./gradlew connectedAndroidTest

# Clean and rebuild
./gradlew clean assembleDebug
```

## Testing

The project includes unit tests using JUnit 4 and Mockito.

```bash
# Run all unit tests
./gradlew test

# Run tests with coverage report
./gradlew testDebugUnitTestCoverage
```

## Version

- **Current Version**: 1.0.0
- **Min SDK**: 26 (Android 8.0)
- **Target SDK**: 34 (Android 14)

## License

See the root project LICENSE file for details.
