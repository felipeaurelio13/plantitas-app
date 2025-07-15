import { ZodError } from 'zod';

export interface ErrorInfo {
  type: 'validation' | 'network' | 'auth' | 'unknown';
  message: string;
  userFriendlyMessage: string;
  retryable: boolean;
}

export const parseError = (error: unknown): ErrorInfo => {
  if (error instanceof ZodError) {
    return {
      type: 'validation',
      message: error.message,
      userFriendlyMessage: 'Los datos recibidos no son válidos. Por favor, inténtalo de nuevo.',
      retryable: true,
    };
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        type: 'network',
        message: error.message,
        userFriendlyMessage: 'Error de conexión. Verifica tu internet e inténtalo de nuevo.',
        retryable: true,
      };
    }

    // Authentication errors
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return {
        type: 'auth',
        message: error.message,
        userFriendlyMessage: 'Error de autenticación. Por favor, inicia sesión de nuevo.',
        retryable: false,
      };
    }

    // AI/Image analysis errors
    if (message.includes('análisis') || message.includes('imagen') || message.includes('analysis')) {
      return {
        type: 'validation',
        message: error.message,
        userFriendlyMessage: 'No se pudo analizar la imagen. Asegúrate de que sea una foto clara de una planta.',
        retryable: true,
      };
    }

    // Database errors
    if (message.includes('database') || message.includes('base de datos') || message.includes('storage')) {
      return {
        type: 'network',
        message: error.message,
        userFriendlyMessage: 'Error al guardar los datos. Verifica tu conexión e inténtalo de nuevo.',
        retryable: true,
      };
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('tiempo')) {
      return {
        type: 'network',
        message: error.message,
        userFriendlyMessage: 'La operación tardó demasiado. Por favor, inténtalo de nuevo.',
        retryable: true,
      };
    }

    // Default error handling
    return {
      type: 'unknown',
      message: error.message,
      userFriendlyMessage: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
      retryable: true,
    };
  }

  // Fallback for unknown error types
  return {
    type: 'unknown',
    message: String(error),
    userFriendlyMessage: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
    retryable: true,
  };
};

export const shouldRetry = (error: unknown): boolean => {
  const errorInfo = parseError(error);
  return errorInfo.retryable;
};

export const getUserFriendlyMessage = (error: unknown): string => {
  const errorInfo = parseError(error);
  return errorInfo.userFriendlyMessage;
};

export const logError = (error: unknown, context?: string): void => {
  const errorInfo = parseError(error);
  console.error(`[${context || 'App'}] Error:`, {
    type: errorInfo.type,
    message: errorInfo.message,
    userFriendlyMessage: errorInfo.userFriendlyMessage,
    retryable: errorInfo.retryable,
    originalError: error,
  });
};