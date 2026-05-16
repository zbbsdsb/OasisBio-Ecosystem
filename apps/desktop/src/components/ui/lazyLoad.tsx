import React, { Suspense, ComponentType, lazy as reactLazy, useCallback, useState, useEffect, useRef, ReactNode, lazy } from 'react';

export interface LazyLoadOptions {
  fallback?: ReactNode;
  ssr?: boolean;
  prefetch?: boolean;
  prefetchDelay?: number;
}

export interface LazyComponent<T extends ComponentType<unknown>> {
  Component: T;
  preload: () => Promise<void>;
  isLoaded: () => boolean;
  isLoading: () => boolean;
}

const loadedModules = new Set<string>();
const loadingModules = new Map<string, Promise<unknown>>();
const preloadTimers = new Map<string, NodeJS.Timeout>();

export function lazyLoad<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyComponent<T> {
  const { prefetch = false, prefetchDelay = 1000 } = options;
  
  let preloadPromise: Promise<void> | null = null;
  
  const Component = lazy(importFn);
  
  const preload = useCallback(async () => {
    if (loadedModules.has(importFn.toString())) {
      return;
    }
    
    if (loadingModules.has(importFn.toString())) {
      return preloadPromise || Promise.resolve();
    }
    
    const modulePromise = importFn().then((module) => {
      loadedModules.add(importFn.toString());
      loadingModules.delete(importFn.toString());
      return module.default as T;
    });
    
    loadingModules.set(importFn.toString(), modulePromise);
    preloadPromise = modulePromise.then(() => undefined);
    
    return preloadPromise;
  }, [importFn]);
  
  const isLoaded = useCallback(() => {
    return loadedModules.has(importFn.toString());
  }, []);
  
  const isLoading = useCallback(() => {
    return loadingModules.has(importFn.toString());
  }, []);
  
  if (prefetch && typeof window !== 'undefined') {
    const timer = setTimeout(() => {
      preload();
    }, prefetchDelay);
    
    preloadTimers.set(importFn.toString(), timer);
  }
  
  return {
    Component: Component as unknown as T,
    preload,
    isLoaded,
    isLoading,
  };
}

export function createLazyRoute(
  importFn: () => Promise<unknown>,
  options: LazyLoadOptions = {}
) {
  const { ssr = true } = options;
  
  const loader = ssr
    ? () => importFn().then((m) => ({ default: m.default }))
    : importFn;
  
  return lazyLoad(loader as () => Promise<{ default: ComponentType<unknown> }>, options);
}

export interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onLoadingChange?: (isLoading: boolean) => void;
  maxDuration?: number;
}

export interface SuspenseWrapperRef {
  showContent: () => void;
  reset: () => void;
}

export const SuspenseWrapper = React.forwardRef<SuspenseWrapperRef, SuspenseWrapperProps>(
  function SuspenseWrapper(
    { children, fallback = null, onLoadingChange, maxDuration },
    ref
  ) {
    const [isLoading, setIsLoading] = useState(true);
    const [shouldShow, setShouldShow] = useState(false);
    const startTimeRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
      startTimeRef.current = performance.now();
      setIsLoading(true);
      setShouldShow(false);
      onLoadingChange?.(true);
      
      if (maxDuration) {
        timerRef.current = setTimeout(() => {
          setShouldShow(true);
        }, maxDuration);
      }
      
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [maxDuration, onLoadingChange]);
    
    const showContent = useCallback(() => {
      const loadTime = performance.now() - startTimeRef.current;
      
      performanceMonitor?.addMetric?.({
        name: 'lazy-component-load',
        value: loadTime,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'render',
      });
      
      setIsLoading(false);
      setShouldShow(true);
      onLoadingChange?.(false);
    }, [onLoadingChange]);
    
    const reset = useCallback(() => {
      setIsLoading(true);
      setShouldShow(false);
      startTimeRef.current = performance.now();
      onLoadingChange?.(true);
    }, [onLoadingChange]);
    
    React.useImperativeHandle(ref, () => ({
      showContent,
      reset,
    }), [showContent, reset]);
    
    if (!shouldShow && isLoading) {
      return <>{fallback}</>;
    }
    
    return (
      <Suspense fallback={fallback}>
        {shouldShow ? children : fallback}
      </Suspense>
    );
  }
);

export interface LazyBundleOptions {
  modules?: Record<string, () => Promise<unknown>>;
  onModuleLoad?: (moduleName: string) => void;
  onAllLoaded?: () => void;
}

export class LazyBundleLoader {
  private modules: Map<string, () => Promise<unknown>>;
  private loadedModules: Map<string, unknown> = new Map();
  private loadingPromises: Map<string, Promise<unknown>> = new Map();
  private onModuleLoad?: (moduleName: string) => void;
  private onAllLoaded?: () => void;
  
  constructor(options: LazyBundleOptions = {}) {
    this.modules = new Map(options.modules || []);
    this.onModuleLoad = options.onModuleLoad;
    this.onAllLoaded = options.onAllLoaded;
  }
  
  addModule(name: string, loader: () => Promise<unknown>): void {
    this.modules.set(name, loader);
  }
  
  async loadModule(name: string): Promise<unknown> {
    if (this.loadedModules.has(name)) {
      return this.loadedModules.get(name);
    }
    
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }
    
    const loader = this.modules.get(name);
    if (!loader) {
      throw new Error(`Module "${name}" not found`);
    }
    
    const loadPromise = loader().then((module) => {
      this.loadedModules.set(name, module);
      this.loadingPromises.delete(name);
      this.onModuleLoad?.(name);
      
      if (this.loadedModules.size === this.modules.size) {
        this.onAllLoaded?.();
      }
      
      return module;
    });
    
    this.loadingPromises.set(name, loadPromise);
    return loadPromise;
  }
  
  async loadAll(): Promise<Map<string, unknown>> {
    const loadPromises = Array.from(this.modules.keys()).map((name) =>
      this.loadModule(name).then(() => name)
    );
    
    await Promise.all(loadPromises);
    return this.loadedModules;
  }
  
  isLoaded(name: string): boolean {
    return this.loadedModules.has(name);
  }
  
  isLoading(name: string): boolean {
    return this.loadingPromises.has(name);
  }
  
  getLoadedModules(): Map<string, unknown> {
    return new Map(this.loadedModules);
  }
}

export function createLazyBundle(options: LazyBundleOptions = {}) {
  return new LazyBundleLoader(options);
}

export interface PreloadStrategy {
  when?: 'idle' | 'hover' | 'visible' | 'immediate';
  rootMargin?: string;
  threshold?: number;
}

const preloadObserver = typeof window !== 'undefined' 
  ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const preloadFn = (entry.target as HTMLElement).dataset.preload;
            if (preloadFn && !loadedModules.has(preloadFn)) {
              const loader = () => import(/* @vite-ignore */ preloadFn);
              lazyLoad(loader as () => Promise<{ default: ComponentType<unknown> }>, {}).preload();
            }
          }
        });
      },
      { rootMargin: '100px', threshold: 0.1 }
    )
  : null;

export function usePreloadOnHover<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: PreloadStrategy = {}
) {
  const { when = 'hover' } = options;
  const ref = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (when !== 'hover' || !ref.current) return;
    
    const element = ref.current;
    
    const handleMouseEnter = () => {
      if (!loadedModules.has(importFn.toString())) {
        lazyLoad(importFn, { prefetch: true, prefetchDelay: 0 }).preload();
      }
    };
    
    element.addEventListener('mouseenter', handleMouseEnter, { once: true });
    
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [importFn, when]);
  
  return ref;
}

export function usePreloadOnVisible<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: PreloadStrategy = {}
) {
  const { when = 'visible', rootMargin = '100px', threshold = 0.1 } = options;
  const ref = useRef<HTMLElement | null>(null);
  const hasPreloaded = useRef(false);
  
  useEffect(() => {
    if (when !== 'visible' || !ref.current || !preloadObserver) return;
    
    const element = ref.current;
    
    preloadObserver.observe(element);
    
    return () => {
      preloadObserver.unobserve(element);
    };
  }, [when, rootMargin, threshold]);
  
  return ref;
}

export function useIdlePreload<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: PreloadStrategy = {}
) {
  const { when = 'idle' } = options;
  
  useEffect(() => {
    if (when !== 'idle' || typeof window === 'undefined' || !('requestIdleCallback' in window)) {
      return;
    }
    
    const requestIdleCallback = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
    
    const idleCallback = requestIdleCallback || ((cb) => setTimeout(cb, 100));
    
    const id = idleCallback(() => {
      if (!loadedModules.has(importFn.toString())) {
        lazyLoad(importFn, { prefetch: true, prefetchDelay: 0 }).preload();
      }
    });
    
    return () => {
      // Cleanup if needed
    };
  }, [importFn, when]);
}

type PreloadFn<T extends ComponentType<unknown>> = () => Promise<void>;

export function useLazyComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions & PreloadStrategy = {}
): [T | null, PreloadFn<T>, boolean, boolean] {
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const lazyModule = useRef(lazyLoad(importFn, options));
  
  useEffect(() => {
    if (options.when === 'idle') {
      useIdlePreload(importFn, options);
    } else if (options.when === 'visible') {
      usePreloadOnVisible(importFn, options);
    } else if (options.when === 'hover') {
      usePreloadOnHover(importFn, options);
    }
  }, [importFn, options]);
  
  useEffect(() => {
    if (isLoaded || isLoading) return;
    
    setIsLoading(true);
    
    importFn()
      .then((module) => {
        setComponent(() => module.default);
        setIsLoaded(true);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load lazy component:', error);
        setIsLoading(false);
      });
  }, [importFn, isLoaded, isLoading]);
  
  const preload = useCallback(async () => {
    if (isLoaded || isLoading) return;
    
    setIsLoading(true);
    await lazyModule.current.preload();
    setIsLoading(false);
  }, [isLoaded, isLoading]);
  
  return [Component, preload, isLoading, isLoaded];
}

export function clearLazyModuleCache(): void {
  loadedModules.clear();
  loadingModules.clear();
  
  preloadTimers.forEach((timer) => clearTimeout(timer));
  preloadTimers.clear();
}

export function getLazyModuleCacheInfo(): {
  loaded: number;
  loading: number;
} {
  return {
    loaded: loadedModules.size,
    loading: loadingModules.size,
  };
}

declare global {
  interface Window {
    __PRELOADED_MODULES__?: Set<string>;
  }
}

if (typeof window !== 'undefined' && window.__PRELOADED_MODULES__) {
  window.__PRELOADED_MODULES__.forEach((moduleId) => {
    loadedModules.add(moduleId);
  });
}

let performanceMonitor: { addMetric?: (metric: { name: string; value: number; unit: string; timestamp: number; category: string }) => void } | undefined;

if (typeof window !== 'undefined') {
  import('../utils/performance').then((module) => {
    performanceMonitor = module.performanceMonitor;
  }).catch(() => {});
}
