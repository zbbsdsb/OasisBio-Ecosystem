import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AppLayout } from './components/layout'
import { Spinner, ErrorBoundary } from './components/ui'
import { ToastProvider } from './components/ui/Toast'

const WelcomePage = lazy(() => import('./pages/WelcomePage').then(m => ({ default: m.WelcomePage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const VerifyPage = lazy(() => import('./pages/VerifyPage').then(m => ({ default: m.VerifyPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const IdentityListPage = lazy(() => import('./pages/IdentityListPage').then(m => ({ default: m.IdentityListPage })))
const IdentityDetailPage = lazy(() => import('./pages/IdentityDetailPage').then(m => ({ default: m.IdentityDetailPage })))
const IdentityFormPage = lazy(() => import('./pages/IdentityFormPage').then(m => ({ default: m.IdentityFormPage })))
const WorldListPage = lazy(() => import('./pages/WorldListPage').then(m => ({ default: m.WorldListPage })))
const WorldBuilderPage = lazy(() => import('./pages/WorldBuilderPage').then(m => ({ default: m.WorldBuilderPage })))
const WorldDetailPage = lazy(() => import('./pages/WorldDetailPage').then(m => ({ default: m.WorldDetailPage })))
const AbilityListPage = lazy(() => import('./pages/AbilityListPage').then(m => ({ default: m.AbilityListPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const AssistantPage = lazy(() => import('./pages/AssistantPage').then(m => ({ default: m.AssistantPage })))
const AssistantSettingsPage = lazy(() => import('./pages/AssistantSettingsPage').then(m => ({ default: m.AssistantSettingsPage })))
const DeveloperAppsPage = lazy(() => import('./pages/DeveloperAppsPage').then(m => ({ default: m.DeveloperAppsPage })))
const OAuthDocsPage = lazy(() => import('./pages/OAuthDocsPage').then(m => ({ default: m.OAuthDocsPage })))

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <WelcomePage />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/verify"
        element={
          <PublicRoute>
            <VerifyPage />
          </PublicRoute>
        }
      />
      <Route
        path="/oauth/callback"
        element={
          <PublicRoute>
            <OAuthCallbackPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="identities" element={<IdentityListPage />} />
        <Route path="identities/new" element={<IdentityFormPage />} />
        <Route path="identities/:id" element={<IdentityDetailPage />} />
        <Route path="identities/:id/edit" element={<IdentityFormPage isEdit />} />
        <Route path="worlds" element={<WorldListPage />} />
        <Route path="worlds/new" element={<WorldBuilderPage />} />
        <Route path="worlds/:id" element={<WorldDetailPage />} />
        <Route path="abilities" element={<AbilityListPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="assistant/settings" element={<AssistantSettingsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="developer/apps" element={<DeveloperAppsPage />} />
        <Route path="developer/docs" element={<OAuthDocsPage />} />
        <Route path="oauth/docs" element={<OAuthDocsPage />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const OAuthCallbackPage: React.FC = () => {
  const { handleOAuthCallback } = useAuth()

  React.useEffect(() => {
    const url = window.location.href
    if (url.includes('code=') && url.includes('state=')) {
      handleOAuthCallback(url)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Completing authentication...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <Spinner size="lg" />
                  </div>
                }
              >
                <AppRoutes />
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
