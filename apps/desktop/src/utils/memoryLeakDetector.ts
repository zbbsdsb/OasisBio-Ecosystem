export interface LeakReport {
  timestamp: number;
  eventListeners: LeakInfo[];
  timers: LeakInfo[];
  requests: LeakInfo[];
  summary: {
    totalLeaks: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface LeakInfo {
  type: 'eventListener' | 'timer' | 'request';
  target?: string;
  createdAt: number;
  stackTrace?: string;
  count: number;
}

interface TrackedEventListener {
  element: EventTarget | null;
  type: string;
  listener: EventListener;
  options?: AddEventListenerOptions;
  createdAt: number;
  stackTrace?: string;
}

interface TrackedTimer {
  id: number;
  type: 'setTimeout' | 'setInterval';
  createdAt: number;
  stackTrace?: string;
}

interface TrackedRequest {
  controller: AbortController;
  url: string;
  method: string;
  createdAt: number;
  stackTrace?: string;
}

class MemoryLeakDetector {
  private eventListeners: Map<string, TrackedEventListener> = new Map();
  private timers: Map<number, TrackedTimer> = new Map();
  private requests: Map<string, TrackedRequest> = new Map();
  private leakThreshold: number = 10;
  private isEnabled: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.patchEventListeners();
    }
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private captureStackTrace(): string | undefined {
    try {
      const err = new Error();
      return err.stack?.split('\n').slice(3, 8).join('\n');
    } catch {
      return undefined;
    }
  }

  private patchEventListeners(): void {
    if (typeof window === 'undefined') return;

    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function (
      type: string,
      listener: EventListener,
      options?: AddEventListenerOptions
    ) {
      if (memoryLeakDetector.isEnabled) {
        const id = memoryLeakDetector.generateId();
        const tracked: TrackedEventListener = {
          element: this,
          type,
          listener,
          options,
          createdAt: Date.now(),
          stackTrace: memoryLeakDetector.captureStackTrace(),
        };
        memoryLeakDetector.eventListeners.set(id, tracked);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function (
      type: string,
      listener: EventListener,
      options?: AddEventListenerOptions
    ) {
      if (memoryLeakDetector.isEnabled) {
        for (const [id, tracked] of memoryLeakDetector.eventListeners.entries()) {
          if (tracked.element === this && tracked.type === type && tracked.listener === listener) {
            memoryLeakDetector.eventListeners.delete(id);
            break;
          }
        }
      }
      return originalRemoveEventListener.call(this, type, listener, options);
    };
  }

  trackTimer<T extends any[]>(
    fn: (...args: T) => void,
    delay?: number,
    type: 'setTimeout' | 'setInterval' = 'setTimeout'
  ): number {
    const id = type === 'setTimeout'
      ? window.setTimeout(fn, delay)
      : window.setInterval(fn, delay);

    if (this.isEnabled) {
      this.timers.set(id, {
        id,
        type,
        createdAt: Date.now(),
        stackTrace: this.captureStackTrace(),
      });
    }

    return id;
  }

  trackClearTimeout(id: number): void {
    window.clearTimeout(id);
    this.timers.delete(id);
  }

  trackClearInterval(id: number): void {
    window.clearInterval(id);
    this.timers.delete(id);
  }

  trackRequest(
    url: string,
    method: string = 'GET'
  ): {
    controller: AbortController;
    generateId: () => string;
  } {
    const controller = new AbortController();
    const id = this.generateId();

    if (this.isEnabled) {
      this.requests.set(id, {
        controller,
        url,
        method,
        createdAt: Date.now(),
        stackTrace: this.captureStackTrace(),
      });
    }

    return {
      controller,
      generateId: () => id,
    };
  }

  completeRequest(id: string): void {
    this.requests.delete(id);
  }

  cancelRequest(id: string): void {
    const request = this.requests.get(id);
    if (request) {
      request.controller.abort();
      this.requests.delete(id);
    }
  }

  getEventListenerLeaks(): LeakInfo[] {
    const leaks: LeakInfo[] = [];
    const grouped: Map<string, TrackedEventListener[]> = new Map();

    for (const tracked of this.eventListeners.values()) {
      const key = `${tracked.type}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(tracked);
    }

    for (const [type, listeners] of grouped.entries()) {
      if (listeners.length >= this.leakThreshold) {
        leaks.push({
          type: 'eventListener',
          target: type,
          createdAt: listeners[0].createdAt,
          stackTrace: listeners[0].stackTrace,
          count: listeners.length,
        });
      }
    }

    return leaks;
  }

  getTimerLeaks(): LeakInfo[] {
    const leaks: LeakInfo[] = [];

    for (const [id, timer] of this.timers.entries()) {
      const age = Date.now() - timer.createdAt;
      if (timer.type === 'setTimeout' && age > 300000) {
        leaks.push({
          type: 'timer',
          target: `setTimeout-${id}`,
          createdAt: timer.createdAt,
          stackTrace: timer.stackTrace,
          count: 1,
        });
      }
    }

    const intervalCount = Array.from(this.timers.values()).filter(t => t.type === 'setInterval').length;
    if (intervalCount >= this.leakThreshold) {
      leaks.push({
        type: 'timer',
        target: 'setInterval',
        createdAt: Date.now(),
        count: intervalCount,
      });
    }

    return leaks;
  }

  getRequestLeaks(): LeakInfo[] {
    const leaks: LeakInfo[] = [];
    const grouped: Map<string, TrackedRequest[]> = new Map();

    for (const request of this.requests.values()) {
      const key = `${request.method} ${request.url}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(request);
    }

    for (const [url, requests] of grouped.entries()) {
      const activeRequests = requests.filter(r => {
        try {
          return !r.controller.signal.aborted;
        } catch {
          return false;
        }
      });

      if (activeRequests.length >= this.leakThreshold) {
        leaks.push({
          type: 'request',
          target: url,
          createdAt: activeRequests[0].createdAt,
          stackTrace: activeRequests[0].stackTrace,
          count: activeRequests.length,
        });
      }
    }

    return leaks;
  }

  generateReport(): LeakReport {
    const eventListenerLeaks = this.getEventListenerLeaks();
    const timerLeaks = this.getTimerLeaks();
    const requestLeaks = this.getRequestLeaks();

    const totalLeaks = eventListenerLeaks.length + timerLeaks.length + requestLeaks.length;

    let severity: LeakReport['summary']['severity'] = 'low';
    if (totalLeaks >= 20) severity = 'critical';
    else if (totalLeaks >= 10) severity = 'high';
    else if (totalLeaks >= 5) severity = 'medium';

    return {
      timestamp: Date.now(),
      eventListeners: eventListenerLeaks,
      timers: timerLeaks,
      requests: requestLeaks,
      summary: {
        totalLeaks,
        severity,
      },
    };
  }

  getActiveCounts(): { eventListeners: number; timers: number; requests: number } {
    return {
      eventListeners: this.eventListeners.size,
      timers: this.timers.size,
      requests: this.requests.size,
    };
  }

  clearAll(): void {
    for (const [id] of this.timers.entries()) {
      window.clearTimeout(id);
      window.clearInterval(id);
    }
    this.timers.clear();
    this.eventListeners.clear();
    this.requests.clear();
  }

  setLeakThreshold(threshold: number): void {
    this.leakThreshold = threshold;
  }
}

export const memoryLeakDetector = new MemoryLeakDetector();

export function withLeakTracking<T extends (...args: any[]) => any>(
  fn: T,
  name?: string
): T {
  return ((...args: any[]) => {
    const id = memoryLeakDetector.trackTimer(() => fn(...args), undefined, 'setTimeout');
    const result = fn(...args);
    if (result && typeof result.then === 'function') {
      return result.finally(() => memoryLeakDetector.trackClearTimeout(id));
    }
    memoryLeakDetector.trackClearTimeout(id);
    return result;
  }) as T;
}

export function createTrackedEventTarget<T extends EventTarget>(
  target: T,
  trackedTypes: string[]
): T {
  const originalAdd = target.addEventListener.bind(target);
  const originalRemove = target.removeEventListener.bind(target);

  trackedTypes.forEach(type => {
    const listeners: EventListener[] = [];

    target.addEventListener = function (
      eventType: string,
      listener: EventListener,
      options?: AddEventListenerOptions
    ) {
      if (eventType === type) {
        listeners.push(listener);
      }
      return originalAdd(eventType, listener, options);
    };

    target.removeEventListener = function (
      eventType: string,
      listener: EventListener,
      options?: AddEventListenerOptions
    ) {
      if (eventType === type) {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      }
      return originalRemove(eventType, listener, options);
    };
  });

  return target;
}
