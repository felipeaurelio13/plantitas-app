import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../stores/useAuthStore';
import { AUTH_CONFIG, AuthPerformanceTracker } from '../config/authConfig';

interface AuthInitializationState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  progress: {
    step: number;
    message: string;
  };
  retryCount: number;
  emergencyFallbackUsed: boolean;
}

export const useAuthInitialization = () => {
  const { user, initialized, initialize } = useAuthStore();
  const [state, setState] = useState<AuthInitializationState>({
    initialized: false,
    loading: false,
    error: null,
    progress: {
      step: 0,
      message: AUTH_CONFIG.ui.progressSteps[0]
    },
    retryCount: 0,
    emergencyFallbackUsed: false,
  });

  const performanceTracker = useRef<AuthPerformanceTracker | null>(null);
  const timeoutRefs = useRef<{
    primary?: NodeJS.Timeout;
    emergency?: NodeJS.Timeout;
    retry?: NodeJS.Timeout;
  }>({});
  const initializationAttempted = useRef(false);

  const updateProgress = (step: number) => {
    if (step < AUTH_CONFIG.ui.progressSteps.length) {
      setState(prev => ({
        ...prev,
        progress: {
          step,
          message: AUTH_CONFIG.ui.progressSteps[step]
        }
      }));
    }
  };

  const clearTimeouts = () => {
    Object.values(timeoutRefs.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    timeoutRefs.current = {};
  };

  const handleInitializationSuccess = () => {
    if (performanceTracker.current) {
      performanceTracker.current.recordSuccess();
      performanceTracker.current.logPerformance();
    }

    setState(prev => ({
      ...prev,
      initialized: true,
      loading: false,
      error: null,
    }));

    clearTimeouts();
  };

  const handleInitializationError = (error: string, canRetry: boolean = true) => {
    if (performanceTracker.current) {
      performanceTracker.current.recordError(error);
    }

    setState(prev => ({
      ...prev,
      error,
      loading: !canRetry,
    }));

    if (canRetry && state.retryCount < AUTH_CONFIG.initialization.retryAttempts) {
      scheduleRetry();
    }
  };

  const scheduleRetry = () => {
    const newRetryCount = state.retryCount + 1;
    
    if (performanceTracker.current) {
      performanceTracker.current.recordRetry(`Retry attempt ${newRetryCount}`);
    }

    setState(prev => ({
      ...prev,
      retryCount: newRetryCount,
      progress: {
        step: 0,
        message: `Reintentando... (${newRetryCount}/${AUTH_CONFIG.initialization.retryAttempts})`
      }
    }));

    timeoutRefs.current.retry = setTimeout(() => {
      attemptInitialization();
    }, AUTH_CONFIG.initialization.retryDelay);
  };

  const triggerEmergencyFallback = () => {
    if (state.emergencyFallbackUsed) return;

    console.warn('[Auth] Emergency fallback triggered - forcing app render');
    
    if (performanceTracker.current) {
      performanceTracker.current.recordEmergencyFallback();
      performanceTracker.current.logPerformance();
    }

    setState(prev => ({
      ...prev,
      initialized: true,
      loading: false,
      emergencyFallbackUsed: true,
      error: 'Inicialización lenta - continuando...',
    }));

    clearTimeouts();
  };

  const attemptInitialization = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    updateProgress(1); // Verificando sesión...

    try {
      // Start performance tracking if enabled
      if (AUTH_CONFIG.performance.trackInitialization && !performanceTracker.current) {
        performanceTracker.current = new AuthPerformanceTracker();
      }

      updateProgress(2); // Cargando perfil...
      
      // Call the auth store initialize method
      await initialize();
      
      updateProgress(3); // Inicializando...

      // Ensure minimum loading time for UX
      if (AUTH_CONFIG.ui.minLoadingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.ui.minLoadingTime));
      }

      handleInitializationSuccess();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de inicialización';
      handleInitializationError(errorMessage);
    }
  };

  useEffect(() => {
    // Only run once
    if (initializationAttempted.current) return;
    initializationAttempted.current = true;

    // If already initialized from store, skip custom initialization
    if (initialized) {
      handleInitializationSuccess();
      return;
    }

    // Set up primary timeout
    timeoutRefs.current.primary = setTimeout(() => {
      if (!state.initialized) {
        handleInitializationError('Timeout de inicialización', true);
      }
    }, AUTH_CONFIG.initialization.timeout);

    // Set up emergency fallback timeout
    timeoutRefs.current.emergency = setTimeout(() => {
      if (!state.initialized) {
        triggerEmergencyFallback();
      }
    }, AUTH_CONFIG.initialization.emergencyFallbackTimeout);

    // Start initialization
    attemptInitialization();

    // Cleanup on unmount
    return () => {
      clearTimeouts();
    };
  }, []); // Empty dependency array - only run once

  // Watch for external initialization success
  useEffect(() => {
    if (initialized && !state.initialized) {
      handleInitializationSuccess();
    }
  }, [initialized, state.initialized]);

  return {
    ...state,
    user,
    // Expose metrics for debugging
    metrics: performanceTracker.current?.getMetrics(),
  };
};