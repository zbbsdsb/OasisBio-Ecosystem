import { useCallback, useEffect, useRef } from 'react';
import { Logger, LogEntry, LogLevel, createLogger, logger as defaultLogger } from '../utils/logger';

export interface UseLoggerOptions {
  context?: string;
  minLevel?: LogLevel;
  persistLogs?: boolean;
  maxPersistedLogs?: number;
}

export interface UseLoggerReturn {
  debug: (message: string, metadata?: Record<string, unknown>) => void;
  info: (message: string, metadata?: Record<string, unknown>) => void;
  warn: (message: string, metadata?: Record<string, unknown>) => void;
  error: (message: string, metadata?: Record<string, unknown>, error?: Error) => void;
  time: (label: string) => void;
  timeEnd: (label: string, metadata?: Record<string, unknown>) => void;
  group: (label: string) => void;
  groupEnd: () => void;
  table: (data: unknown, label?: string) => void;
  setContext: (context: string) => void;
  getLogs: () => LogEntry[];
  clearLogs: () => void;
}

const LOG_STORAGE_KEY = 'oasisbio_logs';

export function useLogger(options: UseLoggerOptions = {}): UseLoggerReturn {
  const {
    context,
    minLevel,
    persistLogs = false,
    maxPersistedLogs = 100,
  } = options;

  const loggerRef = useRef<Logger>(defaultLogger);
  const logsRef = useRef<LogEntry[]>([]);
  const contextRef = useRef<string | undefined>(context);

  useEffect(() => {
    if (context) {
      loggerRef.current.setContext(context);
      contextRef.current = context;
    }

    if (minLevel) {
      loggerRef.current.setMinLevel(minLevel);
    }

    if (persistLogs) {
      try {
        const stored = localStorage.getItem(LOG_STORAGE_KEY);
        if (stored) {
          logsRef.current = JSON.parse(stored);
        }
      } catch {
        logsRef.current = [];
      }
    }
  }, [context, minLevel, persistLogs]);

  const persistLog = useCallback(
    (entry: LogEntry) => {
      if (!persistLogs) return;

      logsRef.current.push(entry);
      if (logsRef.current.length > maxPersistedLogs) {
        logsRef.current = logsRef.current.slice(-maxPersistedLogs);
      }

      try {
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logsRef.current));
      } catch {
        console.warn('Failed to persist logs to localStorage');
      }
    },
    [persistLogs, maxPersistedLogs]
  );

  const debug = useCallback(
    (message: string, metadata?: Record<string, unknown>) => {
      loggerRef.current.debug(message, metadata);
      persistLog({
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        context: contextRef.current,
        metadata,
      });
    },
    [persistLog]
  );

  const info = useCallback(
    (message: string, metadata?: Record<string, unknown>) => {
      loggerRef.current.info(message, metadata);
      persistLog({
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        context: contextRef.current,
        metadata,
      });
    },
    [persistLog]
  );

  const warn = useCallback(
    (message: string, metadata?: Record<string, unknown>) => {
      loggerRef.current.warn(message, metadata);
      persistLog({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message,
        context: contextRef.current,
        metadata,
      });
    },
    [persistLog]
  );

  const error = useCallback(
    (message: string, metadata?: Record<string, unknown>, err?: Error) => {
      loggerRef.current.error(message, metadata, err);
      persistLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        context: contextRef.current,
        metadata,
        error: err
          ? {
              name: err.name,
              message: err.message,
              stack: err.stack,
            }
          : undefined,
      });
    },
    [persistLog]
  );

  const time = useCallback((label: string) => {
    loggerRef.current.time(label);
  }, []);

  const timeEnd = useCallback((label: string, metadata?: Record<string, unknown>) => {
    loggerRef.current.timeEnd(label, metadata);
  }, []);

  const group = useCallback((label: string) => {
    loggerRef.current.group(label);
  }, []);

  const groupEnd = useCallback(() => {
    loggerRef.current.groupEnd();
  }, []);

  const table = useCallback((data: unknown, label?: string) => {
    loggerRef.current.table(data, label);
  }, []);

  const setContext = useCallback((newContext: string) => {
    loggerRef.current.setContext(newContext);
    contextRef.current = newContext;
  }, []);

  const getLogs = useCallback(() => {
    return [...logsRef.current];
  }, []);

  const clearLogs = useCallback(() => {
    logsRef.current = [];
    if (persistLogs) {
      localStorage.removeItem(LOG_STORAGE_KEY);
    }
  }, [persistLogs]);

  return {
    debug,
    info,
    warn,
    error,
    time,
    timeEnd,
    group,
    groupEnd,
    table,
    setContext,
    getLogs,
    clearLogs,
  };
}

export interface UseComponentLoggerOptions {
  componentName: string;
  trackLifecycle?: boolean;
  trackRenders?: boolean;
}

export interface UseComponentLoggerReturn extends UseLoggerReturn {
  logMount: () => void;
  logUnmount: () => void;
  logRender: () => void;
  logUpdate: (changes?: Record<string, unknown>) => void;
}

export function useComponentLogger(
  options: UseComponentLoggerOptions
): UseComponentLoggerReturn {
  const { componentName, trackLifecycle = true, trackRenders = true } = options;

  const baseLogger = useLogger({ context: componentName });
  const renderCountRef = useRef(0);

  useEffect(() => {
    if (trackLifecycle) {
      baseLogger.debug(`Component mounted`);
    }

    return () => {
      if (trackLifecycle) {
        baseLogger.debug(`Component unmounted`, {
          renderCount: renderCountRef.current,
        });
      }
    };
  }, [trackLifecycle, baseLogger]);

  const logMount = useCallback(() => {
    baseLogger.debug('Component mounted');
  }, [baseLogger]);

  const logUnmount = useCallback(() => {
    baseLogger.debug('Component unmounting', {
      renderCount: renderCountRef.current,
    });
  }, [baseLogger]);

  const logRender = useCallback(() => {
    if (!trackRenders) return;
    renderCountRef.current += 1;
    baseLogger.debug('Component rendered', {
      renderNumber: renderCountRef.current,
    });
  }, [trackRenders, baseLogger]);

  const logUpdate = useCallback(
    (changes?: Record<string, unknown>) => {
      baseLogger.debug('Component updated', changes);
    },
    [baseLogger]
  );

  return {
    ...baseLogger,
    logMount,
    logUnmount,
    logRender,
    logUpdate,
  };
}
