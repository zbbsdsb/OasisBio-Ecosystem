import { cacheService } from './cache'

type OfflineAction = {
  id: string
  type: string
  timestamp: number
  data: unknown
  endpoint: string
  method: 'POST' | 'PUT' | 'DELETE'
  retries: number
}

type OfflineListener = (isOnline: boolean) => void

const OFFLINE_QUEUE_KEY = 'offline-queue'
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

class OfflineService {
  private isOnline: boolean = navigator.onLine
  private listeners: Set<OfflineListener> = new Set()
  private syncInProgress: boolean = false

  constructor() {
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  private handleOnline(): void {
    this.isOnline = true
    this.notifyListeners()
    this.syncOfflineActions()
  }

  private handleOffline(): void {
    this.isOnline = false
    this.notifyListeners()
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isOnline))
  }

  public getOnlineStatus(): boolean {
    return this.isOnline
  }

  public subscribe(listener: OfflineListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  public async queueAction(
    type: string,
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE',
    data: unknown
  ): Promise<string> {
    const action: OfflineAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      timestamp: Date.now(),
      data,
      endpoint,
      method,
      retries: 0
    }

    const queue = this.getQueue()
    queue.push(action)
    this.saveQueue(queue)

    return action.id
  }

  private getQueue(): OfflineAction[] {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private saveQueue(queue: OfflineAction[]): void {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }

  public removeFromQueue(actionId: string): void {
    const queue = this.getQueue().filter(a => a.id !== actionId)
    this.saveQueue(queue)
  }

  public getQueueLength(): number {
    return this.getQueue().length
  }

  public getPendingActions(): OfflineAction[] {
    return this.getQueue()
  }

  public async syncOfflineActions(): Promise<{ synced: number; failed: number }> {
    if (this.syncInProgress || !this.isOnline) {
      return { synced: 0, failed: 0 }
    }

    this.syncInProgress = true
    const queue = this.getQueue()
    let synced = 0
    let failed = 0

    const failedActions: OfflineAction[] = []

    for (const action of queue) {
      try {
        await this.executeAction(action)
        synced++
      } catch (error) {
        action.retries++
        if (action.retries >= MAX_RETRIES) {
          failed++
          console.error(`Action ${action.id} failed after ${MAX_RETRIES} retries:`, error)
        } else {
          failedActions.push(action)
        }
      }
    }

    this.saveQueue(failedActions)
    this.syncInProgress = false

    return { synced, failed }
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    const response = await fetch(action.endpoint, {
      method: action.method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(action.data)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    this.invalidateRelatedCache(action)
  }

  private invalidateRelatedCache(action: OfflineAction): void {
    const patterns: RegExp[] = []

    if (action.type.includes('oasisbio')) {
      patterns.push(/^oasisbios-list$/, /^oasisbio-/)
    }
    if (action.type.includes('ability')) {
      patterns.push(/^abilities-/)
    }
    if (action.type.includes('world')) {
      patterns.push(/^worlds-/, /^world-/, /^world-docs-/)
    }

    patterns.forEach(pattern => cacheService.clearByPattern(pattern))
  }

  public clearQueue(): void {
    this.saveQueue([])
  }

  public async waitForOnline(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline) return true

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        unsubscribe()
        resolve(false)
      }, timeout)

      const unsubscribe = this.subscribe((online) => {
        if (online) {
          clearTimeout(timer)
          unsubscribe()
          resolve(true)
        }
      })
    })
  }
}

export const offlineService = new OfflineService()

export function useOnlineStatus(): boolean {
  return offlineService.getOnlineStatus()
}
