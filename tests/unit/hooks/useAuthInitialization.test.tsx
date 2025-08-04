import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthInitialization } from '../../../src/hooks/useAuthInitialization';
import { AUTH_CONFIG } from '../../../src/config/authConfig';

// Mock the auth store
vi.mock('../../../src/stores/useAuthStore', () => ({
  default: vi.fn(() => ({
    user: null,
    initialized: false,
    initialize: vi.fn(),
  })),
}));

describe('useAuthInitialization', () => {
  let mockAuthStore: any;

  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
    
    mockAuthStore = {
      user: null,
      initialized: false,
      initialize: vi.fn(),
    };
    
    const useAuthStore = require('../../../src/stores/useAuthStore').default;
    useAuthStore.mockReturnValue(mockAuthStore);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAuthInitialization());
      
      expect(result.current.initialized).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.retryCount).toBe(0);
      expect(result.current.emergencyFallbackUsed).toBe(false);
      expect(result.current.progress.step).toBe(0);
      expect(result.current.progress.message).toBe(AUTH_CONFIG.ui.progressSteps[0]);
    });

    it('should start initialization automatically', async () => {
      const { result } = renderHook(() => useAuthInitialization());
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockAuthStore.initialize).toHaveBeenCalled();
      expect(result.current.loading).toBe(true);
    });
  });

  describe('Successful Initialization', () => {
    it('should handle successful initialization', async () => {
      mockAuthStore.initialize.mockResolvedValue(undefined);
      mockAuthStore.initialized = true;

      const { result } = renderHook(() => useAuthInitialization());
      
      await act(async () => {
        vi.advanceTimersByTime(AUTH_CONFIG.ui.minLoadingTime + 100);
      });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });
    });

    it('should progress through all steps during initialization', async () => {
      let initializeResolver: (value: any) => void;
      mockAuthStore.initialize.mockReturnValue(
        new Promise(resolve => { initializeResolver = resolve; })
      );

      const { result } = renderHook(() => useAuthInitialization());
      
      // Check initial step
      expect(result.current.progress.step).toBe(0);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Should progress to step 1 (Verificando sesión...)
      expect(result.current.progress.step).toBe(1);
      expect(result.current.progress.message).toBe('Verificando sesión...');

      // Resolve the initialization
      await act(async () => {
        initializeResolver!(undefined);
        vi.advanceTimersByTime(100);
      });

      // Should progress further
      expect(result.current.progress.step).toBeGreaterThan(1);
    });
  });

  describe('Error Handling and Retries', () => {
    it('should retry on initialization failure', async () => {
      mockAuthStore.initialize
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuthInitialization());
      
      // First attempt fails
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.retryCount).toBe(0);

      // Wait for retry delay
      await act(async () => {
        vi.advanceTimersByTime(AUTH_CONFIG.initialization.retryDelay + 100);
      });

      expect(result.current.retryCount).toBe(1);
      expect(mockAuthStore.initialize).toHaveBeenCalledTimes(2);
    });

    it('should stop retrying after max attempts', async () => {
      mockAuthStore.initialize.mockRejectedValue(new Error('Persistent error'));

      const { result } = renderHook(() => useAuthInitialization());
      
      // Exhaust all retry attempts
      for (let i = 0; i <= AUTH_CONFIG.initialization.retryAttempts; i++) {
        await act(async () => {
          vi.advanceTimersByTime(AUTH_CONFIG.initialization.retryDelay + 100);
        });
      }

      expect(result.current.retryCount).toBe(AUTH_CONFIG.initialization.retryAttempts);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Persistent error');
    });
  });

  describe('Timeout Handling', () => {
    it('should trigger primary timeout', async () => {
      // Make initialize hang indefinitely
      mockAuthStore.initialize.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useAuthInitialization());
      
      // Advance past primary timeout
      await act(async () => {
        vi.advanceTimersByTime(AUTH_CONFIG.initialization.timeout + 100);
      });

      expect(result.current.error).toBe('Timeout de inicialización');
    });

    it('should trigger emergency fallback', async () => {
      // Make initialize hang indefinitely
      mockAuthStore.initialize.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useAuthInitialization());
      
      // Advance past emergency timeout
      await act(async () => {
        vi.advanceTimersByTime(AUTH_CONFIG.initialization.emergencyFallbackTimeout + 100);
      });

      expect(result.current.emergencyFallbackUsed).toBe(true);
      expect(result.current.initialized).toBe(true);
      expect(result.current.error).toBe('Inicialización lenta - continuando...');
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics when enabled', async () => {
      mockAuthStore.initialize.mockResolvedValue(undefined);
      mockAuthStore.initialized = true;

      const { result } = renderHook(() => useAuthInitialization());
      
      await act(async () => {
        vi.advanceTimersByTime(AUTH_CONFIG.ui.minLoadingTime + 100);
      });

      expect(result.current.metrics).toBeDefined();
      expect(result.current.metrics?.success).toBe(true);
      expect(result.current.metrics?.duration).toBeGreaterThan(0);
    });

    it('should detect slow connections', async () => {
      // Simulate slow initialization
      mockAuthStore.initialize.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.performance.slowConnectionThreshold + 100))
      );
      mockAuthStore.initialized = true;

      const { result } = renderHook(() => useAuthInitialization());
      
      await act(async () => {
        vi.advanceTimersByTime(AUTH_CONFIG.performance.slowConnectionThreshold + AUTH_CONFIG.ui.minLoadingTime + 200);
      });

      expect(result.current.metrics?.isSlowConnection).toBe(true);
    });
  });

  describe('External State Changes', () => {
    it('should handle external initialization', async () => {
      const { result, rerender } = renderHook(() => useAuthInitialization());
      
      // Simulate external initialization
      mockAuthStore.initialized = true;
      mockAuthStore.user = { id: '123', email: 'test@example.com' };
      
      rerender();

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
        expect(result.current.user).toEqual({ id: '123', email: 'test@example.com' });
      });
    });
  });
});