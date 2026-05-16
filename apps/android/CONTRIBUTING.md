# Contributing to OasisBio Android

Thank you for your interest in contributing to the OasisBio Android application.

## Code Standards

### Kotlin Style Guide

- Follow the official [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html)
- Use 4 spaces for indentation
- Maximum line length: 120 characters
- Use meaningful names for variables, functions, and classes

### Code Organization

```
package com.oasisbio.app

├── data/
│   ├── local/          # DataStore, SharedPreferences
│   ├── remote/         # API clients, interceptors
│   └── repository/    # Repository implementations
├── di/                # Hilt modules
├── domain/
│   ├── model/         # Domain models
│   └── repository/    # Repository interfaces
├── presentation/
│   ├── navigation/    # Navigation setup
│   └── viewmodel/     # ViewModels
└── util/              # Utility classes
```

### Best Practices

- **Dependency Injection**: Use Hilt for all dependencies
- **Async Operations**: Use Kotlin Coroutines with Flow
- **Error Handling**: Always wrap async operations in try-catch or use Result type
- **Null Safety**: Prefer nullable types and safe calls over force unwrapping
- **Immutable Data**: Use `val` and immutable data classes

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `AuthRepository` |
| Functions | camelCase | `sendOtp()` |
| Variables | camelCase | `accessToken` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Package names | lowercase | `com.oasisbio.app` |

## Git Workflow

### Branch Naming

```
feature/<issue-number>-<short-description>
bugfix/<issue-number>-<short-description>
hotfix/<issue-number>-<short-description>
```

Examples:
- `feature/123-user-authentication`
- `bugfix/456-fix-login-crash`
- `hotfix/789-critical-security-patch`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Build process or auxiliary tool changes |

**Examples:**

```
feat(auth): add OTP verification flow
fix(ui): resolve login screen layout issue
docs(readme): update build instructions
test(auth): add unit tests for AuthRepository
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the code standards
3. Add/update tests for new functionality
4. Ensure all tests pass: `./gradlew test`
5. Update documentation if needed
6. Submit a pull request with a clear description

## Testing Requirements

- All new features must include unit tests
- Minimum coverage for repository and ViewModel layers
- Use descriptive test names: `methodName_expectedBehavior`
- Group related tests using `@Test` annotation

## Additional Resources

- [Android Developers](https://developer.android.com/)
- [Jetpack Compose Documentation](https://developer.android.com/compose)
- [Kotlin Docs](https://kotlinlang.org/docs/home.html)

## Questions?

For questions or discussions, please open an issue on the repository.
