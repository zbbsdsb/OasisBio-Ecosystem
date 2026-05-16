import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { usePerformance, UsePerformanceOptions } from '../../hooks/usePerformance';
import { PerformanceMetric, PerformanceReport, performanceMonitor } from '../../utils/performance';

export interface PerformanceTrackerOptions extends UsePerformanceOptions {
  trackVirtualList?: boolean;
  trackLazyImages?: boolean;
  trackBundleSize?: boolean;
  enableFPS?: boolean;
  fpsUpdateInterval?: number;
}

export interface FPSData {
  current: number;
  average: number;
  min: number;
  max: number;
  frameCount: number;
}

export interface PerformanceTrackerResult {
  fps: FPSData;
  metrics: PerformanceMetric[];
  report: PerformanceReport | null;
  clearAll: () => void;
  exportMetrics: () => string;
  logReport: () => void;
}

function useFPS(updateInterval: number = 1000): FPSData {
  const [fpsData, setFpsData] = useState<FPSData>({
    current: 60,
    average: 60,
    min: 60,
    max: 60,
    frameCount: 0,
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let frameCount = 0;
    let lastUpdate = performance.now();

    const measureFrame = (currentTime: number) => {
      const delta = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      frameTimesRef.current.push(delta);

      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      frameCount++;

      if (currentTime - lastUpdate >= updateInterval) {
        const avgFrameTime =
          frameTimesRef.current.reduce((a, b) => a + b, 0) /
          frameTimesRef.current.length;
        const currentFps = 1000 / avgFrameTime;
        const minFps = 1000 / Math.max(...frameTimesRef.current);
        const maxFps = 1000 / Math.min(...frameTimesRef.current);

        setFpsData({
          current: Math.round(currentFps),
          average: Math.round(currentFps),
          min: Math.round(minFps),
          max: Math.round(maxFps),
          frameCount,
        });

        performanceMonitor.addMetric({
          name: 'fps',
          value: currentFps,
          unit: 'count',
          timestamp: Date.now(),
          category: 'render',
          metadata: { fps: Math.round(currentFps) },
        });

        lastUpdate = currentTime;
        frameCount = 0;
      }

      rafIdRef.current = requestAnimationFrame(measureFrame);
    };

    rafIdRef.current = requestAnimationFrame(measureFrame);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [updateInterval]);

  return fpsData;
}

export function usePerformanceTracker(
  options: PerformanceTrackerOptions = {}
): PerformanceTrackerResult {
  const {
    trackVirtualList = false,
    trackLazyImages = false,
    trackBundleSize = false,
    enableFPS = false,
    fpsUpdateInterval = 1000,
    ...performanceOptions
  } = options;

  const [report, setReport] = useState<PerformanceReport | null>(null);
  const fpsData = enableFPS ? useFPS(fpsUpdateInterval) : {
    current: 0,
    average: 0,
    min: 0,
    max: 0,
    frameCount: 0,
  };

  const {
    metrics,
    getMetrics,
    clearMetrics,
    recordMemoryUsage,
    logSlowOperations,
  } = usePerformance({
    trackMemory: performanceOptions.trackMemory ?? true,
    memoryInterval: performanceOptions.memoryInterval ?? 5000,
    autoReport: false,
  });

  const generateReport = useCallback((): PerformanceReport => {
    return performanceMonitor.generateReport();
  }, []);

  const clearAll = useCallback(() => {
    clearMetrics();
    setReport(null);
    frameTimesRef.current = [];
  }, [clearMetrics]);

  const exportMetrics = useCallback((): string => {
    const data = {
      timestamp: Date.now(),
      fps: fpsData,
      metrics: metrics,
      report: generateReport(),
    };
    return JSON.stringify(data, null, 2);
  }, [fpsData, metrics, generateReport]);

  const logReport = useCallback(() => {
    const reportData = generateReport();
    console.group('📊 Performance Report');
    console.log('FPS:', fpsData);
    console.log('Summary:', reportData.summary);
    console.log('Total Metrics:', metrics.length);
    console.table(
      metrics.slice(-20).map((m) => ({
        name: m.name,
        value: m.value.toFixed(2),
        unit: m.unit,
        category: m.category,
      }))
    );
    console.groupEnd();
  }, [fpsData, metrics, generateReport]);

  useEffect(() => {
    if (trackVirtualList) {
      const observer = new MutationObserver(() => {
        performanceMonitor.addMetric({
          name: 'virtual-list-render',
          value: performance.now(),
          unit: 'ms',
          timestamp: Date.now(),
          category: 'render',
        });
      });

      document.querySelectorAll('[data-virtual-list]').forEach((el) => {
        observer.observe(el, { childList: true, subtree: true });
      });

      return () => observer.disconnect();
    }
  }, [trackVirtualList]);

  useEffect(() => {
    if (trackLazyImages) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (img.dataset.src) {
                performanceMonitor.addMetric({
                  name: 'lazy-image-visible',
                  value: performance.now(),
                  unit: 'ms',
                  timestamp: Date.now(),
                  category: 'render',
                  metadata: { src: img.src },
                });
              }
            }
          });
        },
        { rootMargin: '100px' }
      );

      document.querySelectorAll('[data-lazy-image]').forEach((el) => {
        observer.observe(el);
      });

      return () => observer.disconnect();
    }
  }, [trackLazyImages]);

  return {
    fps: fpsData,
    metrics,
    report,
    clearAll,
    exportMetrics,
    logReport,
  };
}

const frameTimesRef: number[] = [];

export interface PerformanceOverlayProps {
  showFPS?: boolean;
  showMemory?: boolean;
  showMetrics?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  updateInterval?: number;
}

export const PerformanceOverlay = memo(function PerformanceOverlay({
  showFPS = true,
  showMemory = false,
  showMetrics = false,
  position = 'top-right',
  updateInterval = 500,
}: PerformanceOverlayProps) {
  const [fps, setFps] = useState(60);
  const [memory, setMemory] = useState<number | null>(null);
  const [metricsCount, setMetricsCount] = useState(0);

  useEffect(() => {
    if (import.meta.env.PROD) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measure = (currentTime: number) => {
      frameCount++;
      const delta = currentTime - lastTime;

      if (delta >= updateInterval) {
        const currentFps = Math.round((frameCount * 1000) / delta);
        setFps(currentFps);
        frameCount = 0;
        lastTime = currentTime;

        performanceMonitor.addMetric({
          name: 'fps-overlay',
          value: currentFps,
          unit: 'count',
          timestamp: Date.now(),
          category: 'render',
        });
      }

      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);

    return () => cancelAnimationFrame(rafId);
  }, [updateInterval]);

  useEffect(() => {
    if (!showMemory) return;

    const interval = setInterval(() => {
      if ('memory' in performance && (performance as { memory?: { usedJSHeapSize: number } }).memory) {
        const mem = (performance as { memory: { usedJSHeapSize: number } }).memory;
        setMemory(mem.usedJSHeapSize);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [showMemory, updateInterval]);

  useEffect(() => {
    if (!showMetrics) return;

    const interval = setInterval(() => {
      const metrics = performanceMonitor.getMetrics();
      setMetricsCount(metrics.length);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [showMetrics, updateInterval]);

  if (import.meta.env.PROD) return null;

  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
  };

  const getFpsColor = (fpsValue: number): string => {
    if (fpsValue >= 55) return 'text-green-400';
    if (fpsValue >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatMemory = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)}KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 pointer-events-none flex flex-col gap-1`}
    >
      {showFPS && (
        <div className={`bg-black/70 px-2 py-1 rounded text-xs font-mono ${getFpsColor(fps)}`}>
          {fps} FPS
        </div>
      )}
      {showMemory && memory !== null && (
        <div className="bg-black/70 px-2 py-1 rounded text-xs font-mono text-gray-300">
          {formatMemory(memory)}
        </div>
      )}
      {showMetrics && (
        <div className="bg-black/70 px-2 py-1 rounded text-xs font-mono text-gray-400">
          {metricsCount} metrics
        </div>
      )}
    </div>
  );
});

export interface PerformanceBadgeProps {
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const PerformanceBadge = memo(function PerformanceBadge({
  label = 'P',
  variant = 'default',
}: PerformanceBadgeProps) {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    if (import.meta.env.PROD) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measure = (currentTime: number) => {
      frameCount++;
      const delta = currentTime - lastTime;

      if (delta >= 1000) {
        setFps(Math.round((frameCount * 1000) / delta));
        frameCount = 0;
        lastTime = currentTime;
      }

      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const getVariantColor = (): string => {
    if (fps >= 55) {
      return variant === 'default' ? 'bg-green-500' : `bg-${variant}-500`;
    }
    if (fps >= 30) {
      return 'bg-yellow-500';
    }
    return 'bg-red-500';
  };

  return (
    <div
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${getVariantColor()}`}
      title={`FPS: ${fps}`}
    >
      {label}
    </div>
  );
});

export function trackRenderPerformance(
  componentName: string,
  options: { log?: boolean; threshold?: number } = {}
): void {
  const { log = false, threshold = 16 } = options;

  const startMark = `${componentName}-render-start`;
  const endMark = `${componentName}-render-end`;
  const measureName = `${componentName}-render`;

  performance.mark(startMark);

  const endHandler = () => {
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    const measures = performance.getEntriesByName(measureName);
    const lastMeasure = measures[measures.length - 1];

    if (lastMeasure) {
      const duration = lastMeasure.duration;

      performanceMonitor.addMetric({
        name: `render-${componentName}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'render',
        metadata: { component: componentName },
      });

      if (log || duration > threshold) {
        console.log(
          `[Performance] ${componentName} render: ${duration.toFixed(2)}ms`
        );
      }

      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    }

    requestAnimationFrame(endHandler);
  };

  requestAnimationFrame(endHandler);
}

export function withRenderTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  const WithRenderTracking: React.FC<P> = (props) => {
    useEffect(() => {
      if (import.meta.env.PROD) return;

      const startMark = `${componentName}-mount-start`;
      const endMark = `${componentName}-mount-end`;

      performance.mark(startMark);

      requestAnimationFrame(() => {
        performance.mark(endMark);
        performance.measure(`${componentName}-mount`, startMark, endMark);

        const measures = performance.getEntriesByName(`${componentName}-mount`);
        if (measures.length > 0) {
          const duration = measures[measures.length - 1].duration;

          performanceMonitor.addMetric({
            name: `mount-${componentName}`,
            value: duration,
            unit: 'ms',
            timestamp: Date.now(),
            category: 'render',
            metadata: { component: componentName },
          });

          performance.clearMarks(startMark);
          performance.clearMarks(endMark);
          performance.clearMeasures(`${componentName}-mount`);
        }
      });
    }, []);

    return <WrappedComponent {...props} />;
  };

  WithRenderTracking.displayName = `WithRenderTracking(${componentName})`;
  return WithRenderTracking;
}
