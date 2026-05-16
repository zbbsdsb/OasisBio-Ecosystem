import React, { Suspense, lazy, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const PERFORMANCE_MARKS = {
  appStart: 'app-start',
  reactRender: 'react-render',
  appRendered: 'app-rendered',
}

const reportPerformance = (metric: string, duration: number) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric}: ${duration.toFixed(2)}ms`)
  }
  if (typeof window !== 'undefined' && 'sendBeacon' in navigator) {
    const data = JSON.stringify({
      metric,
      duration,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    })
    navigator.sendBeacon('/api/metrics', data)
  }
}

const measureTime = (mark: string): number => {
  if (typeof window === 'undefined') return 0
  const timing = performance.getEntriesByName(mark)
  if (timing.length > 0) {
    return timing[timing.length - 1].startTime
  }
  return 0
}

const AppLoader: React.FC = () => {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const reactRenderMark = performance.now()
    performance.mark(PERFORMANCE_MARKS.reactRender)
    const reactRenderDuration = performance.now() - reactRenderMark

    const appStartTime = measureTime(PERFORMANCE_MARKS.appStart)
    if (appStartTime > 0) {
      reportPerformance('initial-to-react-render', reactRenderDuration)
    }

    const idleCallbackId = requestIdleCallback(() => {
      setIsReady(true)
      performance.mark(PERFORMANCE_MARKS.appRendered)
      const totalTime = performance.now() - reactRenderMark
      reportPerformance('react-render-to-ready', totalTime)
    }, { timeout: 100 })

    return () => {
      cancelIdleCallback(idleCallbackId)
    }
  }, [])

  if (!isReady) {
    return null
  }

  return <App />
}

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[Startup Error]', event.error)
      setHasError(true)
    }
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        color: '#333',
      }}>
        <h1>Something went wrong</h1>
        <button onClick={() => window.location.reload()}>Reload App</button>
      </div>
    )
  }

  return <>{children}</>
}

const LoadingFallback: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'system-ui, sans-serif',
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: '3px solid #e0e0e0',
      borderTopColor: '#2196f3',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
    <p style={{ marginTop: 16, color: '#666' }}>Loading...</p>
  </div>
)

const RootComponent: React.FC = () => (
  <ErrorBoundary>
    <AppLoader />
  </ErrorBoundary>
)

if (typeof window !== 'undefined') {
  performance.mark(PERFORMANCE_MARKS.appStart)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <RootComponent />
    </Suspense>
  </React.StrictMode>,
)

if (module.hot) {
  module.hot.accept()
}
