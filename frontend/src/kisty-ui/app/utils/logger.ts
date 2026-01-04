/**
 * Logger utility for client-side logging
 * Only logs in development mode to avoid console pollution in production
 */

type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment) {
      // In production, only log errors
      return level === 'error';
    }
    return true;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  log(message: string, ...args: unknown[]): void {
    if (this.shouldLog('log')) {
      console.log(this.formatMessage('log', message), ...args);
    }
  }

  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      const errorMessage = error instanceof Error 
        ? `${message}: ${error.message}`
        : message;
      console.error(this.formatMessage('error', errorMessage), error, ...args);
      
      // In production, you might want to send errors to an error tracking service
      if (!this.isDevelopment && error) {
        // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
      }
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }
}

export const logger = new Logger();
export default logger;

