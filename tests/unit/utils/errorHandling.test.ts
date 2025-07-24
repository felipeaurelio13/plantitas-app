import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleApiError, handleNetworkError, handleValidationError, logError, formatErrorMessage } from '../../../src/lib/errorHandling';

// Mock de console para evitar logs en tests
const consoleSpy = {
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  info: vi.spyOn(console, 'info').mockImplementation(() => {})
};

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleApiError', () => {
    it('should handle API errors with status codes', () => {
      const apiError = {
        status: 404,
        message: 'Plant not found',
        code: 'PLANT_NOT_FOUND'
      };

      const result = handleApiError(apiError);

      expect(result).toEqual({
        type: 'api',
        status: 404,
        message: 'Plant not found',
        code: 'PLANT_NOT_FOUND',
        userFriendly: 'No se pudo encontrar la planta'
      });
    });

    it('should handle 401 unauthorized errors', () => {
      const apiError = {
        status: 401,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      };

      const result = handleApiError(apiError);

      expect(result.userFriendly).toBe('Sesión expirada. Por favor, inicia sesión nuevamente');
    });

    it('should handle 403 forbidden errors', () => {
      const apiError = {
        status: 403,
        message: 'Forbidden',
        code: 'FORBIDDEN'
      };

      const result = handleApiError(apiError);

      expect(result.userFriendly).toBe('No tienes permisos para realizar esta acción');
    });

    it('should handle 500 server errors', () => {
      const apiError = {
        status: 500,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };

      const result = handleApiError(apiError);

      expect(result.userFriendly).toBe('Error del servidor. Inténtalo de nuevo más tarde');
    });

    it('should handle unknown status codes', () => {
      const apiError = {
        status: 999,
        message: 'Unknown error',
        code: 'UNKNOWN'
      };

      const result = handleApiError(apiError);

      expect(result.userFriendly).toBe('Error inesperado. Inténtalo de nuevo');
    });

    it('should handle errors without status code', () => {
      const apiError = {
        message: 'Network error',
        code: 'NETWORK_ERROR'
      };

      const result = handleApiError(apiError);

      expect(result.status).toBe(0);
      expect(result.userFriendly).toBe('Error de conexión. Verifica tu internet');
    });
  });

  describe('handleNetworkError', () => {
    it('should handle network timeout errors', () => {
      const networkError = new Error('Request timeout');
      networkError.name = 'TimeoutError';

      const result = handleNetworkError(networkError);

      expect(result).toEqual({
        type: 'network',
        message: 'Request timeout',
        userFriendly: 'La conexión tardó demasiado. Inténtalo de nuevo',
        retryable: true
      });
    });

    it('should handle connection refused errors', () => {
      const networkError = new Error('Connection refused');
      networkError.name = 'ConnectionError';

      const result = handleNetworkError(networkError);

      expect(result.userFriendly).toBe('No se pudo conectar al servidor. Verifica tu conexión');
    });

    it('should handle DNS resolution errors', () => {
      const networkError = new Error('DNS resolution failed');
      networkError.name = 'DNSError';

      const result = handleNetworkError(networkError);

      expect(result.userFriendly).toBe('Error de conexión. Verifica tu internet');
    });

    it('should handle generic network errors', () => {
      const networkError = new Error('Network error');

      const result = handleNetworkError(networkError);

      expect(result.userFriendly).toBe('Error de conexión. Verifica tu internet');
    });

    it('should handle fetch API errors', () => {
      const fetchError = new TypeError('Failed to fetch');

      const result = handleNetworkError(fetchError);

      expect(result.userFriendly).toBe('Error de conexión. Verifica tu internet');
    });
  });

  describe('handleValidationError', () => {
    it('should handle Zod validation errors', () => {
      const validationError = {
        name: 'ZodError',
        issues: [
          { path: ['name'], message: 'Required' },
          { path: ['email'], message: 'Invalid email' }
        ]
      };

      const result = handleValidationError(validationError);

      expect(result).toEqual({
        type: 'validation',
        message: 'Validation failed',
        userFriendly: 'Datos inválidos. Revisa los campos marcados',
        fields: {
          name: 'Required',
          email: 'Invalid email'
        }
      });
    });

    it('should handle single field validation errors', () => {
      const validationError = {
        name: 'ZodError',
        issues: [
          { path: ['email'], message: 'Invalid email format' }
        ]
      };

      const result = handleValidationError(validationError);

      expect(result.fields).toEqual({
        email: 'Invalid email format'
      });
    });

    it('should handle nested field validation errors', () => {
      const validationError = {
        name: 'ZodError',
        issues: [
          { path: ['careProfile', 'wateringFrequency'], message: 'Must be a number' }
        ]
      };

      const result = handleValidationError(validationError);

      expect(result.fields).toEqual({
        'careProfile.wateringFrequency': 'Must be a number'
      });
    });

    it('should handle non-Zod validation errors', () => {
      const validationError = new Error('Invalid data');

      const result = handleValidationError(validationError);

      expect(result.userFriendly).toBe('Datos inválidos. Revisa la información ingresada');
    });
  });

  describe('logError', () => {
    it('should log API errors', () => {
      const apiError = {
        type: 'api',
        status: 404,
        message: 'Plant not found'
      };

      logError(apiError);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[API Error]',
        expect.objectContaining({
          status: 404,
          message: 'Plant not found'
        })
      );
    });

    it('should log network errors', () => {
      const networkError = {
        type: 'network',
        message: 'Connection timeout'
      };

      logError(networkError);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[Network Error]',
        expect.objectContaining({
          message: 'Connection timeout'
        })
      );
    });

    it('should log validation errors', () => {
      const validationError = {
        type: 'validation',
        message: 'Validation failed',
        fields: { name: 'Required' }
      };

      logError(validationError);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[Validation Error]',
        expect.objectContaining({
          message: 'Validation failed',
          fields: { name: 'Required' }
        })
      );
    });

    it('should log unknown error types', () => {
      const unknownError = {
        type: 'unknown',
        message: 'Something went wrong'
      };

      logError(unknownError);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[Unknown Error]',
        expect.objectContaining({
          message: 'Something went wrong'
        })
      );
    });

    it('should include user context in logs', () => {
      const apiError = {
        type: 'api',
        status: 500,
        message: 'Server error',
        userId: 'user-123',
        action: 'createPlant'
      };

      logError(apiError);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[API Error]',
        expect.objectContaining({
          userId: 'user-123',
          action: 'createPlant'
        })
      );
    });
  });

  describe('formatErrorMessage', () => {
    it('should format API error messages', () => {
      const apiError = {
        type: 'api',
        status: 404,
        message: 'Plant not found'
      };

      const result = formatErrorMessage(apiError);

      expect(result).toBe('No se pudo encontrar la planta');
    });

    it('should format network error messages', () => {
      const networkError = {
        type: 'network',
        message: 'Connection timeout'
      };

      const result = formatErrorMessage(networkError);

      expect(result).toBe('La conexión tardó demasiado. Inténtalo de nuevo');
    });

    it('should format validation error messages', () => {
      const validationError = {
        type: 'validation',
        message: 'Validation failed',
        fields: { name: 'Required' }
      };

      const result = formatErrorMessage(validationError);

      expect(result).toBe('Datos inválidos. Revisa los campos marcados');
    });

    it('should format unknown error messages', () => {
      const unknownError = {
        type: 'unknown',
        message: 'Something went wrong'
      };

      const result = formatErrorMessage(unknownError);

      expect(result).toBe('Error inesperado. Inténtalo de nuevo');
    });

    it('should handle errors without type', () => {
      const error = {
        message: 'Generic error'
      };

      const result = formatErrorMessage(error);

      expect(result).toBe('Error inesperado. Inténtalo de nuevo');
    });

    it('should handle errors with custom userFriendly message', () => {
      const error = {
        type: 'api',
        message: 'Server error',
        userFriendly: 'Mensaje personalizado'
      };

      const result = formatErrorMessage(error);

      expect(result).toBe('Mensaje personalizado');
    });
  });

  describe('Error handling integration', () => {
    it('should handle complete error flow', () => {
      const apiError = {
        status: 500,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };

      const handledError = handleApiError(apiError);
      const formattedMessage = formatErrorMessage(handledError);
      logError(handledError);

      expect(handledError.type).toBe('api');
      expect(handledError.status).toBe(500);
      expect(formattedMessage).toBe('Error del servidor. Inténtalo de nuevo más tarde');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle validation error flow', () => {
      const validationError = {
        name: 'ZodError',
        issues: [
          { path: ['name'], message: 'Required' }
        ]
      };

      const handledError = handleValidationError(validationError);
      const formattedMessage = formatErrorMessage(handledError);
      logError(handledError);

      expect(handledError.type).toBe('validation');
      expect(handledError.fields.name).toBe('Required');
      expect(formattedMessage).toBe('Datos inválidos. Revisa los campos marcados');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle network error flow', () => {
      const networkError = new Error('Request timeout');
      networkError.name = 'TimeoutError';

      const handledError = handleNetworkError(networkError);
      const formattedMessage = formatErrorMessage(handledError);
      logError(handledError);

      expect(handledError.type).toBe('network');
      expect(handledError.retryable).toBe(true);
      expect(formattedMessage).toBe('La conexión tardó demasiado. Inténtalo de nuevo');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('Error recovery scenarios', () => {
    it('should identify retryable errors', () => {
      const retryableErrors = [
        { type: 'network', message: 'Timeout' },
        { type: 'api', status: 503 },
        { type: 'api', status: 429 }
      ];

      retryableErrors.forEach(error => {
        const handled = error.type === 'network' 
          ? handleNetworkError(new Error(error.message))
          : handleApiError(error);
        
        expect(handled.retryable).toBe(true);
      });
    });

    it('should identify non-retryable errors', () => {
      const nonRetryableErrors = [
        { type: 'api', status: 400 },
        { type: 'api', status: 401 },
        { type: 'api', status: 403 },
        { type: 'validation' }
      ];

      nonRetryableErrors.forEach(error => {
        const handled = error.type === 'validation'
          ? handleValidationError({ name: 'ZodError', issues: [] })
          : handleApiError(error);
        
        expect(handled.retryable).toBe(false);
      });
    });
  });
}); 