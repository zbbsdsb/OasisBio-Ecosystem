export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: any;
}

export interface Logger {
  debug(message: string, metadata?: any): void;
  info(message: string, metadata?: any): void;
  warn(message: string, metadata?: any): void;
  error(message: string, metadata?: any): void;
}

export class ConsoleLogger implements Logger {
  debug(message: string, metadata?: any): void {
    console.debug(this.formatLog('debug', message, metadata));
  }

  info(message: string, metadata?: any): void {
    console.info(this.formatLog('info', message, metadata));
  }

  warn(message: string, metadata?: any): void {
    console.warn(this.formatLog('warn', message, metadata));
  }

  error(message: string, metadata?: any): void {
    console.error(this.formatLog('error', message, metadata));
  }

  private formatLog(level: LogEntry['level'], message: string, metadata?: any): string {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      metadata
    };
    return JSON.stringify(entry);
  }
}

export const logger: Logger = new ConsoleLogger();
