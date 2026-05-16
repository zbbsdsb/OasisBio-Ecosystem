import { useCallback, useEffect, useRef, useState } from 'react';
import {
  performanceMonitor,
  PerformanceMetric,
  PerformanceReport,
} from '../utils/performance';

export interface UsePerformanceOptions {
  trackRender?: boolean;
  trackMemory?: boolean;
  memoryInterval?: number;
  autoReport?: boolean;
  reportInterval?: number;
}

export interface UsePerformanceReturn {
  metrics: PerformanceMetric[];
  report: PerformanceReport | null;
  startMeasure: (name: string) => void;
  endMeasure: (name: string, metadata?: Record<string, unknown>) => number | null;
  measureAsync: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
  clearMetrics: () => void;
  getMetrics: (category?: PerformanceMetric['category']) => PerformanceMetric[];
  getWebVitals: () => PerformanceMetric[];
  recordMemoryUsage: () => void;
  logSlowOperations: (thresholdMs?: number) => void;
}

export function usePerformance(options: UsePerformanceOptions = {}): UsePerformanceReturn {
  const {
    trackMemory = false,
    memoryInterval = 5000,
    autoReport = false,
    reportInterval = 30000,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  
  const memoryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reportIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (import.meta.env.PROD) return;

    if (trackMemory) {
      memoryIntervalRef.current = setInterval(() => {
        performanceMonitor.recordMemoryUsage();
        setMetrics(performanceMonitor.getMetrics());
      }, memoryInterval);
    }

    if (autoReport) {
      reportIntervalRef.current = setInterval(() => {
        const newReport = performanceMonitor.generateReport();
        setReport(newReport);
        console.log('📊 Performance Report:', newReport.summary);
      }, reportInterval);
    }

    return () => {
      if (memoryIntervalRef.current) {
        clearInterval(memoryIntervalRef.current);
      }
      if (reportIntervalRef.current) {
        clearInterval(reportIntervalRef.current);
      }
    };
  }, [trackMemory, memoryInterval, autoReport, reportInterval]);

  const startMeasure = useCallback((name: string) => {
    performanceMonitor.startMeasure(name);
  }, []);

  const endMeasure = useCallback(
    (name: string, metadata?: Record<string, unknown>) => {
      const result = performanceMonitor.endMeasure(name, 'custom', metadata);
      setMetrics(performanceMonitor.getMetrics());
      return result;
    },
    []
  );

  const measureAsync = useCallback(async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
    const result = await performanceMonitor.measureApiTime(name, fn);
    setMetrics(performanceMonitor.getMetrics());
    return result;
  }, []);

  const clearMetrics = useCallback(() => {
    performanceMonitor.clearMetrics();
    setMetrics([]);
    setReport(null);
  }, []);

  const getMetrics = useCallback(
    (category?: PerformanceMetric['category']) => {
      return performanceMonitor.getMetrics(category);
    },
    []
  );

  const getWebVitals = useCallback(() => {
    return performanceMonitor.getWebVitals();
  }, []);

  const recordMemoryUsage = useCallback(() => {
    performanceMonitor.recordMemoryUsage();
    setMetrics(performanceMonitor.getMetrics());
  }, []);

  const logSlowOperations = useCallback((thresholdMs?: number) => {
    performanceMonitor.logSlowOperations(thresholdMs);
  }, []);

  return {
    metrics,
    report,
    startMeasure,
    endMeasure,
    measureAsync,
    clearMetrics,
    getMetrics,
    getWebVitals,
    recordMemoryUsage,
    logSlowOperations,
  };
}

export interface UseComponentPerformanceOptions {
  componentName: string;
  trackRenders?: boolean;
  trackProps?: boolean;
}

export interface UseComponentPerformanceReturn {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  onRender: () => void;
}

export function useComponentPerformance(
  options: UseComponentPerformanceOptions
): UseComponentPerformanceReturn {
  const { componentName, trackRenders = true } = options;

  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState(0);
  const [averageRenderTime, setAverageRenderTime] = useState(0);

  const onRender = useCallback(() => {
    if (import.meta.env.PROD || !trackRenders) return;

    renderCountRef.current += 1;
    setRenderCount(renderCountRef.current);

    const measureName = `render-${componentName}-${renderCountRef.current}`;
    performanceMonitor.startMeasure(measureName);
    
    requestAnimationFrame(() => {
      const duration = performanceMonitor.endMeasure(measureName, 'render', {
        component: componentName,
        renderNumber: renderCountRef.current,
      });

      if (duration !== null) {
        renderTimesRef.current.push(duration);
        setLastRenderTime(duration);

        const avg =
          renderTimesRef.current.reduce((sum, t) => sum + t, 0) /
          renderTimesRef.current.length;
        setAverageRenderTime(avg);
      }
    });
  }, [componentName, trackRenders]);

  return {
    renderCount,
    lastRenderTime,
    averageRenderTime,
    onRender,
  };
}

export interface UseApiPerformanceOptions {
  endpoint: string;
  warnThreshold?: number;
}

export interface UseApiPerformanceReturn {
  callCount: number;
  averageTime: number;
  lastCallTime: number;
  errorCount: number;
  measureCall: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function useApiPerformance(
  options: UseApiPerformanceOptions
): UseApiPerformanceReturn {
  const { endpoint, warnThreshold = 1000 } = options;

  const callCountRef = useRef(0);
  const timesRef = useRef<number[]>([]);
  const errorCountRef = useRef(0);
  
  const [callCount, setCallCount] = useState(0);
  const [averageTime, setAverageTime] = useState(0);
  const [lastCallTime, setLastCallTime] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const measureCall = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      if (import.meta.env.PROD) return fn();

      callCountRef.current += 1;
      setCallCount(callCountRef.current);

      try {
        const startTime = performance.now();
        const result = await fn();
        const duration = performance.now() - startTime;

        timesRef.current.push(duration);
        setLastCallTime(duration);

        const avg =
          timesRef.current.reduce((sum, t) => sum + t, 0) /
          timesRef.current.length;
        setAverageTime(avg);

        if (duration > warnThreshold) {
          console.warn(
            `⚠️ Slow API call to "${endpoint}": ${duration.toFixed(2)}ms (threshold: ${warnThreshold}ms)`
          );
        }

        performanceMonitor.addMetric({
          name: `api-${endpoint}`,
          value: duration,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'api',
          metadata: { endpoint, status: 'success' },
        });

        return result;
      } catch (error) {
        errorCountRef.current += 1;
        setErrorCount(errorCountRef.current);

        performanceMonitor.addMetric({
          name: `api-${endpoint}`,
          value: 0,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'api',
          metadata: {
            endpoint,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown',
          },
        });

        throw error;
      }
    },
    [endpoint, warnThreshold]
  );

  return {
    callCount,
    averageTime,
    lastCallTime,
    errorCount,
    measureCall,
  };
}
