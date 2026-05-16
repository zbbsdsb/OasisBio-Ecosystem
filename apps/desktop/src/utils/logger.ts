export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logFilePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
  context?: string;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: 'warn',
  enableConsole: true,
  enableFile: false,
  maxFileSize: 5 * 1024 * 1024,
  maxFiles: 5,
};

class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize: number = 100;

  constructor(config: Partial<LoggerConfig> = {}) {
    const isProduction = import.meta.env.PROD;
    
    this.config = {
      ...DEFAULT_CONFIG,
      minLevel: isProduction ? 'warn' : 'debug',
      ...config,
    };

    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Uncaught error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }, event.error);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection', {
          reason: String(event.reason),
        }, event.reason instanceof Error ? event.reason : undefined);
      });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatEntry(entry: LogEntry): string {
    const timestamp = `\x1b[36m${entry.timestamp}\x1b[0m`;
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[35m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
    };
    const levelReset = '\x1b[0m';
    const levelStr = `${levelColors[entry.level]}[${entry.level.toUpperCase().padEnd(5)}]${levelReset}`;
    const context = entry.context ? `\x1b[34m[${entry.context}]\x1b[0m` : '';
    
    let formatted = `${timestamp} ${levelStr}${context} ${entry.message}`;
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      formatted += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }
    
    if (entry.error) {
      formatted += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        formatted += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    return formatted;
  }

  private formatEntryPlain(entry: LogEntry): string {
    let formatted = `${entry.timestamp} [${entry.level.toUpperCase()}]`;
    if (entry.context) {
      formatted += ` [${entry.context}]`;
    }
    formatted += ` ${entry.message}`;
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      formatted += ` | ${JSON.stringify(entry.metadata)}`;
    }
    
    if (entry.error) {
      formatted += ` | Error: ${entry.error.name}: ${entry.error.message}`;
    }
    
    return formatted;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context: this.config.context,
      metadata,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private async writeToConsole(entry: LogEntry): Promise<void> {
    if (!this.config.enableConsole) return;

    const formatted = this.formatEntry(entry);
    
    switch (entry.level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.config.enableFile) return;

    this.logBuffer.push(entry);
    
    if (this.logBuffer.length >= this.maxBufferSize) {
      await this.flushLogs();
    }
  }

  async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logs = this.logBuffer.map((e) => this.formatEntryPlain(e)).join('\n');
    this.logBuffer = [];

    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.writeLog) {
        await (window as any).electronAPI.writeLog(logs);
      }
    } catch (err) {
      console.error('Failed to write logs to file:', err);
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    const entry = this.createEntry('debug', message, metadata);
    this.writeToConsole(entry);
    this.writeToFile(entry);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    const entry = this.createEntry('info', message, metadata);
    this.writeToConsole(entry);
    this.writeToFile(entry);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;
    const entry = this.createEntry('warn', message, metadata);
    this.writeToConsole(entry);
    this.writeToFile(entry);
  }

  error(
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.shouldLog('error')) return;
    const entry = this.createEntry('error', message, metadata, error);
    this.writeToConsole(entry);
    this.writeToFile(entry);
  }

  withContext(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }

  setContext(context: string): void {
    this.config.context = context;
  }

  setMinLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  getMinLevel(): LogLevel {
    return this.config.minLevel;
  }

  time(label: string): void {
    if (!this.shouldLog('debug')) return;
    performance.mark(`log-time-${label}-start`);
  }

  timeEnd(label: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    
    try {
      performance.mark(`log-time-${label}-end`);
      performance.measure(`log-time-${label}`, `log-time-${label}-start`, `log-time-${label}-end`);
      
      const measures = performance.getEntriesByName(`log-time-${label}`, 'measure');
      const duration = measures[measures.length - 1]?.duration;
      
      if (duration !== undefined) {
        this.debug(`${label}: ${duration.toFixed(2)}ms`, metadata);
      }
      
      performance.clearMarks(`log-time-${label}-start`);
      performance.clearMarks(`log-time-${label}-end`);
      performance.clearMeasures(`log-time-${label}`);
    } catch {
      // Ignore if marks don't exist
    }
  }

  group(label: string): void {
    if (!this.shouldLog('debug')) return;
    console.group(label);
  }

  groupEnd(): void {
    if (!this.shouldLog('debug')) return;
    console.groupEnd();
  }

  table(data: unknown, label?: string): void {
    if (!this.shouldLog('debug')) return;
    if (label) {
      console.log(label);
    }
    console.table(data as any);
  }
}

class ContextLogger {
  private logger: Logger;
  private context: string;

  constructor(logger: Logger, context: string) {
    this.logger = logger;
    this.context = context;
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    const originalContext = this.logger.config.context;
    this.logger.setContext(this.context);
    this.logger.debug(message, metadata);
    this.logger.setContext(originalContext || '');
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    const originalContext = this.logger.config.context;
    this.logger.setContext(this.context);
    this.logger.info(message, metadata);
    this.logger.setContext(originalContext || '');
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    const originalContext = this.logger.config.context;
    this.logger.setContext(this.context);
    this.logger.warn(message, metadata);
    this.logger.setContext(originalContext || '');
  }

  error(
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): void {
    const originalContext = this.logger.config.context;
    this.logger.setContext(this.context);
    this.logger.error(message, metadata, error);
    this.logger.setContext(originalContext || '');
  }
}

export const logger = new Logger();

export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return new Logger(config);
}

export function createContextLogger(context: string): ContextLogger {
  return logger.withContext(context);
}
