# OasisBio-Ecosystem Next Steps Plan

## 1. Current Project Status

### 1.1 Completed Work
| Category | Item | Status |
|----------|------|--------|
| Project Structure | Monorepo directory layout | ✅ Done |
| Android Project | Basic Android Studio project setup | ✅ Done |
| Dependencies | Core dependencies configured | ✅ Done |
| Documentation | API docs, architecture docs | ✅ Done |
| CI/CD | GitHub Actions workflows | ✅ Done |
| Placeholder dirs | iOS, Web, Desktop, packages | ✅ Done |

### 1.2 Current Android Project State
```
apps/android/app/src/main/kotlin/com/oasisbio/app/
└── OasisBioApplication.kt    # Only Application class exists
```

### 1.3 Build Configuration
- **minSdk**: 26
- **targetSdk**: 34
- **compileSdk**: 34
- **Compose**: 1.6.1
- **Dependencies**: Retrofit, OkHttp, Supabase, Dagger, Timber, DataStore

---

## 2. Next Steps Overview

### Phase 1: Core Infrastructure (Week 1)
- Implement dependency injection (Dagger Hilt)
- Set up network layer (Retrofit API clients)
- Implement local storage (DataStore for auth tokens)

### Phase 2: Authentication Flow (Week 2)
- Implement auth repository and use cases
- Create login/register screens with OTP
- Implement session management

### Phase 3: Identity Management (Week 3)
- Implement identity repository and API
- Create identity list screen
- Create identity detail/edit screens

### Phase 4: UI Polish & Testing (Week 4)
- Refine UI components
- Add unit tests
- Fix bugs and improve error handling

---

## 3. Detailed Implementation Plan

### 3.1 Phase 1: Core Infrastructure

#### Task 3.1.1: Set up Dagger Hilt
**Files to Create:**
- `di/HiltModule.kt` - Main DI module
- Update `OasisBioApplication.kt` - Add `@HiltAndroidApp`

**Dependencies:**
```kotlin
implementation 'com.google.dagger:hilt-android:2.51.1'
kapt 'com.google.dagger:hilt-android-compiler:2.51.1'
```

#### Task 3.1.2: Implement Network Layer
**Files to Create:**
- `data/remote/OasisBioApi.kt` - Retrofit API interface
- `data/remote/SupabaseClient.kt` - Supabase auth client
- `data/remote/OkHttpInterceptor.kt` - Auth token interceptor

**API Endpoints:**
| Method | Endpoint | Function |
|--------|----------|----------|
| POST | `/api/auth/login` | login(email: String) |
| POST | `/api/auth/verify` | verifyOtp(email: String, otp: String) |
| GET | `/api/oasisbios` | getIdentities() |
| POST | `/api/oasisbios` | createIdentity(identity: OasisBioRequest) |
| GET | `/api/oasisbios/{id}` | getIdentity(id: String) |
| PUT | `/api/oasisbios/{id}` | updateIdentity(id: String, identity: OasisBioRequest) |
| DELETE | `/api/oasisbios/{id}` | deleteIdentity(id: String) |

#### Task 3.1.3: Implement Local Storage
**Files to Create:**
- `data/local/AuthDataStore.kt` - DataStore wrapper for auth tokens
- `data/local/model/Session.kt` - Session data model

---

### 3.2 Phase 2: Authentication Flow

#### Task 3.2.1: Domain Layer - Auth
**Files to Create:**
- `domain/model/User.kt` - User model
- `domain/model/Session.kt` - Domain session model
- `domain/repository/AuthRepository.kt` - Auth repo interface
- `domain/usecase/SignInWithOtpUseCase.kt` - Send OTP use case
- `domain/usecase/VerifyOtpUseCase.kt` - Verify OTP use case
- `domain/usecase/SignOutUseCase.kt` - Sign out use case

#### Task 3.2.2: Data Layer - Auth
**Files to Create:**
- `data/repository/AuthRepositoryImpl.kt` - Auth repo implementation

#### Task 3.2.3: Presentation Layer - Auth
**Files to Create:**
- `presentation/ui/auth/WelcomeScreen.kt` - Welcome screen
- `presentation/ui/auth/LoginScreen.kt` - Email input for OTP
- `presentation/ui/auth/OtpScreen.kt` - OTP verification screen
- `presentation/viewmodel/AuthViewModel.kt` - Auth ViewModel
- `presentation/navigation/AuthNavGraph.kt` - Auth navigation

---

### 3.3 Phase 3: Identity Management

#### Task 3.3.1: Domain Layer - Identity
**Files to Create:**
- `domain/model/OasisBio.kt` - Identity model
- `domain/repository/IdentityRepository.kt` - Identity repo interface
- `domain/usecase/GetAllIdentitiesUseCase.kt`
- `domain/usecase/GetIdentityByIdUseCase.kt`
- `domain/usecase/CreateIdentityUseCase.kt`
- `domain/usecase/UpdateIdentityUseCase.kt`
- `domain/usecase/DeleteIdentityUseCase.kt`

#### Task 3.3.2: Data Layer - Identity
**Files to Create:**
- `data/repository/IdentityRepositoryImpl.kt`

#### Task 3.3.3: Presentation Layer - Identity
**Files to Create:**
- `presentation/ui/identity/IdentityListScreen.kt` - List of identities
- `presentation/ui/identity/IdentityDetailScreen.kt` - View single identity
- `presentation/ui/identity/IdentityEditScreen.kt` - Create/edit identity
- `presentation/viewmodel/IdentityViewModel.kt`
- `presentation/navigation/MainNavGraph.kt`

---

### 3.4 Phase 4: UI Polish & Testing

#### Task 3.4.1: UI Components
**Files to Create:**
- `presentation/ui/common/LoadingState.kt` - Loading indicator
- `presentation/ui/common/ErrorState.kt` - Error display
- `presentation/ui/common/Button.kt` - Custom button components
- `presentation/ui/common/TextField.kt` - Custom text fields

#### Task 3.4.2: Testing
**Files to Create:**
- `data/repository/AuthRepositoryTest.kt`
- `data/repository/IdentityRepositoryTest.kt`
- `domain/usecase/AuthUseCasesTest.kt`
- `domain/usecase/IdentityUseCasesTest.kt`
- `presentation/viewmodel/AuthViewModelTest.kt`

---

## 4. Timeline Summary

| Week | Phase | Focus | Deliverables |
|------|-------|-------|--------------|
| 1 | Infrastructure | DI, Network, Storage | Hilt setup, API clients, DataStore |
| 2 | Authentication | OTP Flow, Auth Screens | Login, OTP verification, session mgmt |
| 3 | Identity Mgmt | CRUD Operations | Identity list, create, edit, detail |
| 4 | Polish & Testing | UI, Tests, Bug fixes | Components, unit tests, error handling |

---

## 5. File Creation Checklist

### Data Layer
- [ ] `data/remote/OasisBioApi.kt`
- [ ] `data/remote/SupabaseClient.kt`
- [ ] `data/remote/OkHttpInterceptor.kt`
- [ ] `data/local/AuthDataStore.kt`
- [ ] `data/local/model/Session.kt`
- [ ] `data/repository/AuthRepositoryImpl.kt`
- [ ] `data/repository/IdentityRepositoryImpl.kt`

### Domain Layer
- [ ] `domain/model/User.kt`
- [ ] `domain/model/OasisBio.kt`
- [ ] `domain/repository/AuthRepository.kt`
- [ ] `domain/repository/IdentityRepository.kt`
- [ ] `domain/usecase/SignInWithOtpUseCase.kt`
- [ ] `domain/usecase/VerifyOtpUseCase.kt`
- [ ] `domain/usecase/SignOutUseCase.kt`
- [ ] `domain/usecase/GetAllIdentitiesUseCase.kt`
- [ ] `domain/usecase/GetIdentityByIdUseCase.kt`
- [ ] `domain/usecase/CreateIdentityUseCase.kt`
- [ ] `domain/usecase/UpdateIdentityUseCase.kt`
- [ ] `domain/usecase/DeleteIdentityUseCase.kt`

### Presentation Layer
- [ ] `presentation/ui/auth/WelcomeScreen.kt`
- [ ] `presentation/ui/auth/LoginScreen.kt`
- [ ] `presentation/ui/auth/OtpScreen.kt`
- [ ] `presentation/ui/identity/IdentityListScreen.kt`
- [ ] `presentation/ui/identity/IdentityDetailScreen.kt`
- [ ] `presentation/ui/identity/IdentityEditScreen.kt`
- [ ] `presentation/ui/common/LoadingState.kt`
- [ ] `presentation/ui/common/ErrorState.kt`
- [ ] `presentation/viewmodel/AuthViewModel.kt`
- [ ] `presentation/viewmodel/IdentityViewModel.kt`
- [ ] `presentation/navigation/AuthNavGraph.kt`
- [ ] `presentation/navigation/MainNavGraph.kt`

### DI
- [ ] `di/HiltModule.kt`
- [ ] Update `OasisBioApplication.kt`

### Tests
- [ ] `data/repository/AuthRepositoryTest.kt`
- [ ] `data/repository/IdentityRepositoryTest.kt`
- [ ] `domain/usecase/AuthUseCasesTest.kt`
- [ ] `domain/usecase/IdentityUseCasesTest.kt`

---

## 6. Key Implementation Notes

### 6.1 API Authentication
- Use Supabase Auth for OTP-based authentication
- Store JWT tokens in DataStore
- Add token interceptor to Retrofit for authenticated requests

### 6.2 Error Handling
- Create sealed class `Result<T>` for API responses
- Handle network errors gracefully
- Show appropriate error messages to users

### 6.3 UI Best Practices
- Follow Material 3 design guidelines
- Use Compose state hoisting patterns
- Implement proper navigation with Navigation Compose

### 6.4 Security
- Never hardcode API keys
- Use BuildConfig for environment variables
- Enable ProGuard for release builds

---

**Document Version**: 1.0  
**Created Date**: May 2026  
**Last Updated**: May 10, 2026  
**Author**: OasisBio Engineering Team