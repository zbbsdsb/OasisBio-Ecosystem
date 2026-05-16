export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  category: 'render' | 'api' | 'startup' | 'memory' | 'custom';
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  timestamp: number;
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    averageRenderTime: number;
    averageApiTime: number;
    startupTime: number;
    memoryUsage?: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeMeasures: Map<string, number> = new Map();
  private isProduction: boolean;
  private maxMetrics: number = 1000;

  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.initStartupTracking();
  }

  private initStartupTracking(): void {
    if (this.isProduction) return;

    if (typeof performance !== 'undefined') {
      performance.mark('app-start');
    }
  }

  startMeasure(name: string): void {
    if (this.isProduction) return;
    this.activeMeasures.set(name, performance.now());
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  endMeasure(
    name: string,
    category: PerformanceMetric['category'] = 'custom',
    metadata?: Record<string, unknown>
  ): number | null {
    if (this.isProduction) return null;

    const startTime = this.activeMeasures.get(name);
    if (startTime === undefined) {
      console.warn(`Performance measure "${name}" was not started`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch {
        // Ignore if marks don't exist
      }
    }

    this.activeMeasures.delete(name);

    this.addMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      category,
      metadata,
    });

    return duration;
  }

  measureRenderTime<T>(
    componentName: string,
    renderFn: () => T
  ): T {
    if (this.isProduction) return renderFn();

    this.startMeasure(`render-${componentName}`);
    const result = renderFn();
    this.endMeasure(`render-${componentName}`, 'render', { component: componentName });
    return result;
  }

  async measureApiTime<T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    if (this.isProduction) return apiCall();

    this.startMeasure(`api-${endpoint}`);
    try {
      const result = await apiCall();
      this.endMeasure(`api-${endpoint}`, 'api', { endpoint, status: 'success' });
      return result;
    } catch (error) {
      this.endMeasure(`api-${endpoint}`, 'api', { 
        endpoint, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  markStartupComplete(): number | null {
    if (this.isProduction) return null;

    if (typeof performance !== 'undefined') {
      performance.mark('app-ready');
      try {
        performance.measure('app-startup', 'app-start', 'app-ready');
      } catch {
        // Ignore if marks don't exist
      }
    }

    const startupTime = this.endMeasure('app-startup', 'startup');
    
    if (startupTime !== null) {
      this.addMetric({
        name: 'app-startup',
        value: startupTime,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'startup',
      });
    }

    return startupTime;
  }

  recordMemoryUsage(): void {
    if (this.isProduction) return;

    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.addMetric({
        name: 'memory-used',
        value: memory.usedJSHeapSize,
        unit: 'bytes',
        timestamp: Date.now(),
        category: 'memory',
        metadata: {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        },
      });
    }
  }

  getWebVitals(): PerformanceMetric[] {
    if (this.isProduction) return [];

    const vitals: PerformanceMetric[] = [];
    
    if (typeof performance !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        vitals.push({
          name: 'dom-content-loaded',
          value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'startup',
        });

        vitals.push({
          name: 'load-complete',
          value: navigation.loadEventEnd - navigation.loadEventStart,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'startup',
        });

        vitals.push({
          name: 'dom-interactive',
          value: navigation.domInteractive - navigation.fetchStart,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'startup',
        });
      }

      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        vitals.push({
          name: entry.name,
          value: entry.startTime,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'render',
        });
      });
    }

    return vitals;
  }

  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(category?: PerformanceMetric['category']): PerformanceMetric[] {
    if (category) {
      return this.metrics.filter((m) => m.category === category);
    }
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
    this.activeMeasures.clear();
  }

  generateReport(): PerformanceReport {
    const renderMetrics = this.metrics.filter((m) => m.category === 'render');
    const apiMetrics = this.metrics.filter((m) => m.category === 'api');
    const startupMetrics = this.metrics.filter((m) => m.category === 'startup');
    const memoryMetrics = this.metrics.filter((m) => m.category === 'memory');

    const averageRenderTime = renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
      : 0;

    const averageApiTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0;

    const startupTime = startupMetrics.find((m) => m.name === 'app-startup')?.value || 0;

    const latestMemory = memoryMetrics[memoryMetrics.length - 1];

    return {
      timestamp: Date.now(),
      metrics: [...this.metrics],
      summary: {
        totalMetrics: this.metrics.length,
        averageRenderTime,
        averageApiTime,
        startupTime,
        memoryUsage: latestMemory?.value,
      },
    };
  }

  logSlowOperations(thresholdMs: number = 100): void {
    if (this.isProduction) return;

    const slowOps = this.metrics.filter(
      (m) => m.unit === 'ms' && m.value > thresholdMs
    );

    if (slowOps.length > 0) {
      console.warn(
        `⚠️ Slow operations detected (>${thresholdMs}ms):`,
        slowOps.map((m) => ({
          name: m.name,
          duration: `${m.value.toFixed(2)}ms`,
          category: m.category,
        }))
      );
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  category: PerformanceMetric['category'] = 'custom'
): Promise<T> {
  return performanceMonitor.measureApiTime(name, fn);
}

export function measureSync<T>(
  name: string,
  fn: () => T,
  category: PerformanceMetric['category'] = 'custom'
): T {
  return performanceMonitor.measureRenderTime(name, fn);
}

export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  const WithPerformanceTracking = (props: P) => {
    if (import.meta.env.PROD) {
      return <WrappedComponent {...props} />;
    }

    performanceMonitor.startMeasure(`render-${componentName}`);
    const result = <WrappedComponent {...props} />;
    performanceMonitor.endMeasure(`render-${componentName}`, 'render', { component: componentName });
    
    return result;
  };

  WithPerformanceTracking.displayName = `WithPerformanceTracking(${componentName})`;
  return WithPerformanceTracking;
}
