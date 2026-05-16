import { logger } from './logger';
import { performanceMonitor } from './performance';

interface DevToolsConfig {
  showWelcomeMessage?: boolean;
  showPerformanceTips?: boolean;
  warnOnSlowRenders?: boolean;
  slowRenderThreshold?: number;
}

const DEFAULT_CONFIG: DevToolsConfig = {
  showWelcomeMessage: true,
  showPerformanceTips: true,
  warnOnSlowRenders: true,
  slowRenderThreshold: 16,
};

export function initDevTools(config: DevToolsConfig = {}): void {
  if (import.meta.env.PROD) return;

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (finalConfig.showWelcomeMessage) {
    showWelcomeMessage();
  }

  if (finalConfig.showPerformanceTips) {
    showPerformanceTips();
  }

  if (finalConfig.warnOnSlowRenders) {
    setupSlowRenderWarning(finalConfig.slowRenderThreshold!);
  }

  setupReactDevToolsHints();
}

function showWelcomeMessage(): void {
  console.log(
    '%c🚀 OasisBio Desktop',
    'font-size: 24px; font-weight: bold; color: #3b82f6;'
  );
  console.log(
    '%cDevelopment Mode Active',
    'font-size: 14px; color: #6b7280;'
  );
  console.log('');
  console.log('%cQuick Tips:', 'font-weight: bold; color: #10b981;');
  console.log('  • Press F12 to open DevTools');
  console.log('  • Use React DevTools for component inspection');
  console.log('  • Check the Performance Monitor for metrics');
  console.log('');
}

function showPerformanceTips(): void {
  console.log('%c📊 Performance Tips:', 'font-weight: bold; color: #f59e0b;');
  console.log('  • Avoid inline function definitions in render');
  console.log('  • Use React.memo for expensive components');
  console.log('  • Implement virtualization for long lists');
  console.log('  • Lazy load components with React.lazy()');
  console.log('  • Use useMemo/useCallback for expensive computations');
  console.log('');
}

function setupSlowRenderWarning(thresholdMs: number): void {
  let lastRenderTime = 0;
  let renderCount = 0;

  const originalRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    return originalRequestAnimationFrame((timestamp) => {
      const start = performance.now();
      callback(timestamp);
      const duration = performance.now() - start;

      if (duration > thresholdMs) {
        renderCount++;
        if (renderCount % 10 === 0) {
          logger.warn(`Slow render detected: ${duration.toFixed(2)}ms (threshold: ${thresholdMs}ms)`, {
            renderCount,
            timestamp: new Date().toISOString(),
          });
        }
      }

      lastRenderTime = duration;
    });
  };
}

function setupReactDevToolsHints(): void {
  if (typeof window !== 'undefined') {
    (window as any).__OASISBIO_DEVTOOLS__ = {
      getPerformanceReport: () => performanceMonitor.generateReport(),
      getMetrics: (category?: string) => performanceMonitor.getMetrics(category as any),
      clearMetrics: () => performanceMonitor.clearMetrics(),
      logSlowOperations: (threshold?: number) => performanceMonitor.logSlowOperations(threshold),
    };

    console.log(
      '%c💡 DevTools API available at window.__OASISBIO_DEVTOOLS__',
      'color: #8b5cf6;'
    );
    console.log('  • getPerformanceReport() - Get full performance report');
    console.log('  • getMetrics(category?) - Get metrics by category');
    console.log('  • clearMetrics() - Clear all metrics');
    console.log('  • logSlowOperations(threshold?) - Log slow operations');
    console.log('');
  }
}

export function warnDeprecation(
  deprecated: string,
  replacement?: string,
  since?: string
): void {
  if (import.meta.env.PROD) return;

  let message = `⚠️ "${deprecated}" is deprecated`;
  if (since) {
    message += ` (since v${since})`;
  }
  if (replacement) {
    message += `. Use "${replacement}" instead.`;
  }

  console.warn(message);
  logger.warn(message, { deprecated, replacement, since });
}

export function warnExperimental(feature: string): void {
  if (import.meta.env.PROD) return;

  console.warn(
    `🧪 "${feature}" is experimental and may change in future versions.`
  );
  logger.warn(`Experimental feature: ${feature}`, { feature });
}

export function checkBundleSize(): void {
  if (import.meta.env.PROD) return;

  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    const usedMB = (memory.usedJSHeapSize / (1024 * 1024)).toFixed(2);
    const totalMB = (memory.totalJSHeapSize / (1024 * 1024)).toFixed(2);
    const limitMB = (memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2);

    console.log('%c📦 Memory Usage:', 'font-weight: bold; color: #3b82f6;');
    console.log(`  • Used: ${usedMB} MB`);
    console.log(`  • Total: ${totalMB} MB`);
    console.log(`  • Limit: ${limitMB} MB`);
    console.log('');

    if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
      logger.warn('Memory usage is high (>80% of limit)', {
        used: usedMB,
        limit: limitMB,
      });
    }
  }
}

export function measureComponentRender<P extends object>(
  componentName: string,
  props: P
): void {
  if (import.meta.env.PROD) return;

  const propsKeys = Object.keys(props);
  if (propsKeys.length > 10) {
    logger.warn(
      `Component "${componentName}" has many props (${propsKeys.length}). Consider grouping related props.`,
      { componentName, propsCount: propsKeys.length }
    );
  }
}

export function trackComponentMount(componentName: string): () => void {
  if (import.meta.env.PROD) return () => {};

  const startTime = performance.now();
  logger.debug(`Component "${componentName}" mounted`);

  return () => {
    const duration = performance.now() - startTime;
    logger.debug(`Component "${componentName}" unmounted`, {
      lifetime: `${duration.toFixed(2)}ms`,
    });
  };
}

export function createPerformanceBoundary(
  boundaryName: string
): {
  start: () => void;
  end: () => void;
  measure: <T>(fn: () => T) => T;
} {
  let startTime = 0;

  return {
    start: () => {
      if (!import.meta.env.PROD) {
        startTime = performance.now();
        performance.mark(`${boundaryName}-start`);
      }
    },
    end: () => {
      if (!import.meta.env.PROD && startTime > 0) {
        performance.mark(`${boundaryName}-end`);
        try {
          performance.measure(boundaryName, `${boundaryName}-start`, `${boundaryName}-end`);
          const measures = performance.getEntriesByName(boundaryName, 'measure');
          const duration = measures[measures.length - 1]?.duration;
          
          if (duration !== undefined) {
            logger.debug(`Performance boundary "${boundaryName}": ${duration.toFixed(2)}ms`);
          }
        } catch {
          // Ignore if marks don't exist
        }
      }
    },
    measure: <T,>(fn: () => T): T => {
      if (import.meta.env.PROD) return fn();
      
      performanceMonitor.startMeasure(boundaryName);
      const result = fn();
      performanceMonitor.endMeasure(boundaryName, 'custom');
      return result;
    },
  };
}
