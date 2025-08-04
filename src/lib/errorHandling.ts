// Error types for different categories of failures
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SERVICE = 'SERVICE',
  USER_INPUT = 'USER_INPUT',
  EXTERNAL_API = 'EXTERNAL_API',
  DATABASE = 'DATABASE',
  UNKNOWN = 'UNKNOWN',
}

// Log levels
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

// Base error interface with metadata
export interface ErrorContext {
  category: ErrorCategory;
  operation: string;
  userId?: string;
  plantId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  stack?: string;
  retryCount?: number;
}

// Custom error classes
export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly context: ErrorContext;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    category: ErrorCategory,
    operation: string,
    isRetryable = false,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.category = category;
    this.isRetryable = isRetryable;
    
    this.context = {
      category,
      operation,
      timestamp: new Date(),
      metadata,
      stack: this.stack,
    };

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public addContext(context: Partial<ErrorContext>): AppError {
    Object.assign(this.context, context);
    return this;
  }
}

export class NetworkError extends AppError {
  constructor(message: string, operation: string, metadata?: Record<string, any>) {
    super(message, ErrorCategory.NETWORK, operation, true, metadata);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, operation: string, metadata?: Record<string, any>) {
    super(message, ErrorCategory.VALIDATION, operation, false, metadata);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, operation: string, metadata?: Record<string, any>) {
    super(message, ErrorCategory.AUTHENTICATION, operation, false, metadata);
  }
}

export class ServiceError extends AppError {
  constructor(message: string, operation: string, isRetryable = false, metadata?: Record<string, any>) {
    super(message, ErrorCategory.SERVICE, operation, isRetryable, metadata);
  }
}

export class ExternalAPIError extends AppError {
  constructor(message: string, operation: string, metadata?: Record<string, any>) {
    super(message, ErrorCategory.EXTERNAL_API, operation, true, metadata);
  }
}

// Structured logger
export class ErrorLogger {
  private isDevelopment = import.meta.env.DEV;
  private logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

  public error(error: Error | AppError, context?: Partial<ErrorContext>): void {
    const logEntry = this.createLogEntry(LogLevel.ERROR, error.message, {
      error: error instanceof AppError ? error.context : undefined,
      context,
      stack: error.stack,
    });

    console.error('[ERROR]', logEntry);

    // In production, you might want to send to external logging service
    if (!this.isDevelopment) {
      this.sendToExternalLogger(logEntry);
    }
  }

  public warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const logEntry = this.createLogEntry(LogLevel.WARN, message, context);
      console.warn('[WARN]', logEntry);
    }
  }

  public info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const logEntry = this.createLogEntry(LogLevel.INFO, message, context);
      console.info('[INFO]', logEntry);
    }
  }

  public debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const logEntry = this.createLogEntry(LogLevel.DEBUG, message, context);
      console.debug('[DEBUG]', logEntry);
    }
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>) {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: this.isDevelopment ? 'development' : 'production',
      ...context,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private sendToExternalLogger(logEntry: any): void {
    // Implementation for external logging service (e.g., Sentry, LogRocket)
    // This is a placeholder for production logging
  }
}

// Retry mechanism with exponential backoff
export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

export class RetryManager {
  private static defaultOptions: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: (error) => error instanceof AppError && error.isRetryable,
  };

  public static async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    let lastError: Error;
    let attempt = 0;

    while (attempt < config.maxAttempts) {
      try {
        const result = await operation();
        
        if (attempt > 0) {
          logger.info(`Operation ${operationName} succeeded after ${attempt + 1} attempts`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Add retry count to error context if it's an AppError
        if (lastError instanceof AppError) {
          lastError.addContext({ retryCount: attempt });
        }

        logger.warn(`Operation ${operationName} failed (attempt ${attempt}/${config.maxAttempts})`, {
          error: lastError.message,
          attempt,
        });

        // Check if we should retry
        if (attempt >= config.maxAttempts || !config.retryCondition!(lastError)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
          config.maxDelay
        );

        await this.delay(delay);
      }
    }

    // All attempts failed
    logger.error(lastError!, { operation: operationName, totalAttempts: attempt });
    throw lastError!;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton logger instance
export const logger = new ErrorLogger();

// Error boundary helper for React components
export const createErrorBoundaryHandler = (componentName: string) => {
  return (error: Error, errorInfo: any) => {
    logger.error(error, {
      component: componentName,
      errorInfo,
      operation: 'component_render',
    });
  };
};

// Utility functions for common error scenarios
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  category: ErrorCategory = ErrorCategory.SERVICE
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    // Convert unknown errors to AppError
    const appError = new AppError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      category,
      operationName,
      false,
      { originalError: error }
    );

    logger.error(appError);
    throw appError;
  }
};

export const wrapServiceMethod = <T extends any[], R>(
  serviceName: string,
  methodName: string,
  originalMethod: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const operationName = `${serviceName}.${methodName}`;
    
    try {
      logger.debug(`Starting operation: ${operationName}`, { args: args.length });
      const result = await originalMethod(...args);
      logger.debug(`Completed operation: ${operationName}`);
      return result;
    } catch (error) {
      if (!(error instanceof AppError)) {
        const wrappedError = new ServiceError(
          error instanceof Error ? error.message : 'Unknown service error',
          operationName,
          false,
          { originalError: error }
        );
        logger.error(wrappedError);
        throw wrappedError;
      }
      
      logger.error(error);
      throw error;
    }
  };
};