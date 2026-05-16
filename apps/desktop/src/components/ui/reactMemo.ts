import React, { memo, ComponentType, useMemo, useCallback } from 'react';

export type MemoizedComponent<P extends object = object> = React.MemoExoticComponent<React.ComponentType<P>> & {
  displayName?: string;
};

export function memoizeComponent<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
): MemoizedComponent<P> {
  const Memoized = memo(Component, areEqual);
  return Memoized as MemoizedComponent<P>;
}

export function createCustomMemo<P extends object>(
  areEqual: (prevProps: P, nextProps: P) => boolean
) {
  return <T extends ComponentType<P>>(Component: T): MemoizedComponent<P> => {
    return memo(Component, areEqual) as MemoizedComponent<P>;
  };
}

export function shallowEqual<objProps extends object>(
  prevProps: objProps,
  nextProps: objProps
): boolean {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
}

export function propsOnlyEqual<P extends object, K extends keyof P>(
  keys: K[]
) {
  return (prevProps: P, nextProps: P): boolean => {
    return keys.every((key) => prevProps[key] === nextProps[key]);
  };
}

export function areDataEqual<T>(
  prevData: T,
  nextData: T,
  keys?: (keyof T)[]
): boolean {
  if (prevData === nextData) return true;
  
  if (!keys) {
    return JSON.stringify(prevData) === JSON.stringify(nextData);
  }

  return keys.every((key) => prevData[key] === nextData[key]);
}

export const withMemo = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return memo(Component);
};

export function createListItemMemo<T extends { id?: string | number; key?: string | number }>() {
  return memo(function ListItem({
    item,
    ...props
  }: { item: T } & Omit<React.HTMLAttributes<HTMLDivElement>, 'key'>) {
    return <div {...props}>{item.id || item.key}</div>;
  });
}

export function useMemoizedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps) as T;
}

export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

export function memoize<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  }) as T;
}

export function createStableMemo<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return React.memo(Component, (prev, next) => {
    for (const key in prev) {
      if (prev[key] !== next[key]) {
        return false;
      }
    }
    return true;
  });
}

export interface MemoizeOptions {
  pure?: boolean;
  areEqual?: (prev: object, next: object) => boolean;
}

export function optimizeComponent<P extends object>(
  Component: React.ComponentType<P>,
  options: MemoizeOptions = {}
): MemoizedComponent<P> {
  const { pure = true, areEqual: customEqual } = options;

  if (customEqual) {
    return memo(Component, customEqual) as MemoizedComponent<P>;
  }

  return memo(Component) as MemoizedComponent<P>;
}

export function withMemoDebounce<T extends ComponentType<unknown>>(
  Component: T,
  wait: number
): T {
  let timeoutId: NodeJS.Timeout | null = null;

  const Memoized = memo((props: React.ComponentProps<T>) => {
    return <Component {...props} />;
  });

  return ((props: React.ComponentProps<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      Memoized(props);
    }, wait);

    return Memoized(props);
  }) as T;
}

export function createAsyncMemo<T extends ComponentType<unknown>>(
  Component: T,
  LoadingComponent: React.ComponentType
): React.FC<React.ComponentProps<T> & { isLoading?: boolean }> {
  const Memoized = memo(Component);
  const MemoizedLoading = memo(LoadingComponent);

  return ((props: React.ComponentProps<T> & { isLoading?: boolean }) => {
    if (props.isLoading) {
      return <MemoizedLoading />;
    }
    return <Memoized {...props} />;
  }) as React.FC<React.ComponentProps<T> & { isLoading?: boolean }>;
}

export function memoizeObject<P extends object>(
  obj: P,
  keys?: (keyof P)[]
): P {
  const cache = new Map<string, P>();

  return ((originalObj: P) => {
    const keyString = keys 
      ? keys.map((k) => `${String(k)}=${JSON.stringify(originalObj[k])}`).join('&')
      : JSON.stringify(originalObj);

    if (cache.has(keyString)) {
      return cache.get(keyString)!;
    }

    cache.set(keyString, originalObj);

    if (cache.size > 50) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    return originalObj;
  })(obj);
}

export { memo as defaultMemo };
