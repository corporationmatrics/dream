/**
 * Client-side logging utility for ERP Platform
 * Handles error tracking, warnings, and debug information
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  stack?: string;
  url?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | Record<string, any>) {
    let context: Record<string, any> | undefined;
    let stack: string | undefined;

    if (error instanceof Error) {
      context = { errorMessage: error.message };
      stack = error.stack;
    } else if (error) {
      context = error;
    }

    this.log('error', message, context, stack);
  }

  /**
   * Log an API request
   */
  logApiRequest(method: string, url: string, body?: any) {
    this.info(`API Request: ${method} ${url}`, { method, url, body });
  }

  /**
   * Log an API response
   */
  logApiResponse(method: string, url: string, status: number, duration: number, response?: any) {
    this.info(`API Response: ${method} ${url} (${status}) - ${duration}ms`, {
      method,
      url,
      status,
      duration,
      response: response && typeof response === 'object' ? Object.keys(response) : undefined,
    });
  }

  /**
   * Log an API error
   */
  logApiError(method: string, url: string, status: number, error: any) {
    this.error(`API Error: ${method} ${url} (${status})`, {
      method,
      url,
      status,
      error: error instanceof Error ? error.message : error,
    });
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, stack?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    this.logs.push(entry);

    // Keep logs under max size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (this.isDevelopment) {
      const logStyle = this.getConsoleStyle(level);
      console.log(
        `%c[${level.toUpperCase()}] ${message}`,
        logStyle,
        context || ''
      );
      if (stack) console.log(stack);
    }

    // Store in localStorage for debugging
    this.persistLogs();
  }

  /**
   * Get console styling for different log levels
   */
  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: 'color: #999; font-weight: normal;',
      info: 'color: #0066cc; font-weight: normal;',
      warn: 'color: #ff9900; font-weight: bold;',
      error: 'color: #cc0000; font-weight: bold;',
    };
    return styles[level];
  }

  /**
   * Persist logs to localStorage
   */
  private persistLogs() {
    try {
      // Keep only the last 100 logs in localStorage due to space constraints
      const storageLogs = this.logs.slice(-100);
      localStorage.setItem(
        'app_logs',
        JSON.stringify(storageLogs)
      );
    } catch (err) {
      // Silently fail if localStorage is unavailable or full
    }
  }

  /**
   * Get all captured logs
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) {
      return this.logs;
    }
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('app_logs');
    } catch (err) {
      // Silently fail
    }
  }

  /**
   * Export logs as JSON file
   */
  exportLogs(filename = 'logs.json') {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Get logs summary as a report
   */
  getReportSummary() {
    const summary = {
      totalLogs: this.logs.length,
      byLevel: {
        debug: this.getLogs('debug').length,
        info: this.getLogs('info').length,
        warn: this.getLogs('warn').length,
        error: this.getLogs('error').length,
      },
      timeRange: {
        start: this.logs[0]?.timestamp,
        end: this.logs[this.logs.length - 1]?.timestamp,
      },
    };
    return summary;
  }
}

// Export singleton instance
export const logger = new Logger();

// Expose to window in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).appLogger = logger;
}
