import { useOnlineStatus } from '../../hooks/useDataLoader'

export function OfflineIndicator() {
  const { isOffline, pendingActions, sync } = useOnlineStatus()

  if (!isOffline && pendingActions === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOffline && (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg mb-2 flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 7.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.656a9 9 0 01-2.228-3.162m0 0l2.829 2.829m-2.829-2.829L3 3"
            />
          </svg>
          <span className="font-medium">You are offline</span>
        </div>
      )}
      {pendingActions > 0 && (
        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="font-medium">
            {pendingActions} action{pendingActions > 1 ? 's' : ''} pending sync
          </span>
          {!isOffline && (
            <button
              onClick={sync}
              className="ml-2 px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors text-sm"
            >
              Sync now
            </button>
          )}
        </div>
      )}
    </div>
  )
}
