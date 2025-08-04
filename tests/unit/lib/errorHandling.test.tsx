import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  AppError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  ServiceError,
  ExternalAPIError,
  ErrorCategory,
  LogLevel,
  ErrorLogger,
  RetryManager,
  logger,
  handleAsyncError,
  wrapServiceMethod,
} from '../../../src/lib/errorHandling';

describe('Error Handling System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Custom Error Classes', () => {
    describe('AppError', () => {
      it('should create error with correct properties', () => {
        const error = new AppError(
          'Test error',
          ErrorCategory.SERVICE,
          'test-operation',
          true,
          { testData: 'test' }
        );

        expect(error.message).toBe('Test error');
        expect(error.category).toBe(ErrorCategory.SERVICE);
        expect(error.isRetryable).toBe(true);
        expect(error.context.operation).toBe('test-operation');
        expect(error.context.metadata?.testData).toBe('test');
        expect(error.context.timestamp).toBeInstanceOf(Date);
      });

      it('should allow adding context', () => {
        const error = new AppError('Test', ErrorCategory.SERVICE, 'test');
        error.addContext({ userId: '123', plantId: '456' });

        expect(error.context.userId).toBe('123');
        expect(error.context.plantId).toBe('456');
      });
    });

    describe('Specialized Error Classes', () => {
      it('should create NetworkError with correct category and retryable flag', () => {
        const error = new NetworkError('Network failed', 'fetch-data');

        expect(error.category).toBe(ErrorCategory.NETWORK);
        expect(error.isRetryable).toBe(true);
      });

      it('should create ValidationError as non-retryable', () => {
        const error = new ValidationError('Invalid input', 'validate-form');

        expect(error.category).toBe(ErrorCategory.VALIDATION);
        expect(error.isRetryable).toBe(false);
      });

      it('should create AuthenticationError as non-retryable', () => {
        const error = new AuthenticationError('Invalid credentials', 'login');

        expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
        expect(error.isRetryable).toBe(false);
      });

      it('should create ServiceError with configurable retry flag', () => {
        const retryableError = new ServiceError('Service down', 'api-call', true);
        const nonRetryableError = new ServiceError('Logic error', 'calculation', false);

        expect(retryableError.isRetryable).toBe(true);
        expect(nonRetryableError.isRetryable).toBe(false);
      });

      it('should create ExternalAPIError as retryable', () => {
        const error = new ExternalAPIError('API timeout', 'openai-request');

        expect(error.category).toBe(ErrorCategory.EXTERNAL_API);
        expect(error.isRetryable).toBe(true);
      });
    });
  });

  describe('ErrorLogger', () => {
    let errorLogger: ErrorLogger;

    beforeEach(() => {
      errorLogger = new ErrorLogger();
    });

    it('should log errors with structured format', () => {
      const error = new AppError('Test error', ErrorCategory.SERVICE, 'test');
      errorLogger.error(error);

      expect(console.error).toHaveBeenCalledWith(
        '[ERROR]',
        expect.objectContaining({
          level: LogLevel.ERROR,
          message: 'Test error',
          timestamp: expect.any(String),
          environment: 'test',
          error: expect.objectContaining({
            category: ErrorCategory.SERVICE,
            operation: 'test',
          }),
        })
      );
    });

    it('should log warnings with context', () => {
      errorLogger.warn('Warning message', { component: 'TestComponent' });

      expect(console.warn).toHaveBeenCalledWith(
        '[WARN]',
        expect.objectContaining({
          level: LogLevel.WARN,
          message: 'Warning message',
          component: 'TestComponent',
        })
      );
    });

    it('should log info messages', () => {
      errorLogger.info('Info message');

      expect(console.info).toHaveBeenCalledWith(
        '[INFO]',
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'Info message',
        })
      );
    });

    it('should log debug messages in development', () => {
      errorLogger.debug('Debug message');

      expect(console.debug).toHaveBeenCalledWith(
        '[DEBUG]',
        expect.objectContaining({
          level: LogLevel.DEBUG,
          message: 'Debug message',
        })
      );
    });
  });

  describe('RetryManager', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await RetryManager.withRetry(operation, 'test-op');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const retryableError = new NetworkError('Network error', 'fetch');
      const operation = vi.fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      const promise = RetryManager.withRetry(operation, 'test-op');

      // Advance timers to trigger retries
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const nonRetryableError = new ValidationError('Validation failed', 'validate');
      const operation = vi.fn().mockRejectedValue(nonRetryableError);

      await expect(RetryManager.withRetry(operation, 'test-op')).rejects.toThrow(
        'Validation failed'
      );

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect max attempts', async () => {
      const retryableError = new NetworkError('Network error', 'fetch');
      const operation = vi.fn().mockRejectedValue(retryableError);

      const promise = RetryManager.withRetry(operation, 'test-op', { maxAttempts: 2 });

      // Advance timer for first retry
      await vi.advanceTimersByTimeAsync(1000);

      await expect(promise).rejects.toThrow('Network error');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      const retryableError = new NetworkError('Network error', 'fetch');
      const operation = vi.fn().mockRejectedValue(retryableError);

      const promise = RetryManager.withRetry(operation, 'test-op', {
        maxAttempts: 3,
        baseDelay: 100,
        backoffFactor: 2,
      });

      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100);
      expect(operation).toHaveBeenCalledTimes(2);

      // Second retry after 200ms (100 * 2^1)
      await vi.advanceTimersByTimeAsync(200);
      expect(operation).toHaveBeenCalledTimes(3);

      await expect(promise).rejects.toThrow('Network error');
    });
  });

  describe('Utility Functions', () => {
    describe('handleAsyncError', () => {
      it('should return result on success', async () => {
        const operation = () => Promise.resolve('success');

        const result = await handleAsyncError(operation, 'test-op');

        expect(result).toBe('success');
      });

      it('should wrap unknown errors in AppError', async () => {
        const operation = () => Promise.reject(new Error('Unknown error'));

        await expect(handleAsyncError(operation, 'test-op')).rejects.toBeInstanceOf(AppError);
      });

      it('should preserve AppError instances', async () => {
        const appError = new ServiceError('Service error', 'test-op');
        const operation = () => Promise.reject(appError);

        await expect(handleAsyncError(operation, 'test-op')).rejects.toBe(appError);
      });
    });

    describe('wrapServiceMethod', () => {
      it('should wrap successful method calls', async () => {
        const originalMethod = vi.fn().mockResolvedValue('result');
        const wrappedMethod = wrapServiceMethod('TestService', 'testMethod', originalMethod);

        const result = await wrappedMethod('arg1', 'arg2');

        expect(result).toBe('result');
        expect(originalMethod).toHaveBeenCalledWith('arg1', 'arg2');
      });

      it('should wrap errors in ServiceError', async () => {
        const originalMethod = vi.fn().mockRejectedValue(new Error('Original error'));
        const wrappedMethod = wrapServiceMethod('TestService', 'testMethod', originalMethod);

        await expect(wrappedMethod()).rejects.toBeInstanceOf(ServiceError);
      });

      it('should preserve AppError instances', async () => {
        const appError = new NetworkError('Network error', 'test');
        const originalMethod = vi.fn().mockRejectedValue(appError);
        const wrappedMethod = wrapServiceMethod('TestService', 'testMethod', originalMethod);

        await expect(wrappedMethod()).rejects.toBe(appError);
      });

      it('should log method execution', async () => {
        const originalMethod = vi.fn().mockResolvedValue('result');
        const wrappedMethod = wrapServiceMethod('TestService', 'testMethod', originalMethod);

        await wrappedMethod();

        expect(console.debug).toHaveBeenCalledWith(
          '[DEBUG]',
          expect.objectContaining({
            message: 'Starting operation: TestService.testMethod',
          })
        );

        expect(console.debug).toHaveBeenCalledWith(
          '[DEBUG]',
          expect.objectContaining({
            message: 'Completed operation: TestService.testMethod',
          })
        );
      });
    });
  });

  describe('Integration', () => {
    it('should work with retry manager and error wrapping', async () => {
      let attempts = 0;
      const operation = () => {
        attempts++;
        if (attempts < 3) {
          throw new NetworkError('Network temporarily down', 'fetch-data');
        }
        return Promise.resolve('success');
      };

      const wrappedOperation = () => handleAsyncError(operation, 'fetch-data');
      
      vi.useFakeTimers();
      const promise = RetryManager.withRetry(wrappedOperation, 'fetch-data');
      
      // Allow retries to complete
      await vi.advanceTimersByTimeAsync(5000);
      
      const result = await promise;
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
      
      vi.useRealTimers();
    });
  });
});