# OasisBio iOS App

OasisBio iOS application built with SwiftUI 6 and Clean Architecture.

## Requirements

- iOS 17.0+
- Xcode 15+
- Swift 6

## Architecture

This project follows Clean Architecture principles:

- **Shared**: Core business logic, models, and utilities
- **Features**: Feature-specific components (Auth, Identity)
- **View**: UI layer using SwiftUI
- **ViewModel**: Presentation logic
- **Repository**: Data access layer
- **API**: Network communication

## Project Structure

```
OasisBio/
├── App.swift              # Application entry point
├── main.swift             # Main entry point
├── Assets.xcassets/       # Resources
├── Info.plist             # Configuration
├── Shared/                # Shared code
│   ├── API/               # Network layer
│   ├── Models/            # Data models
│   ├── Repository/        # Data access
│   ├── DI/                # Dependency injection
│   └── Utils/             # Utilities
└── Features/              # Feature modules
    ├── Auth/              # Authentication
    └── Identity/          # Identity management
```

## Getting Started

1. Clone the repository
2. Open `OasisBio.xcodeproj` in Xcode
3. Build and run

## Dependencies

- No external dependencies required for the core project
