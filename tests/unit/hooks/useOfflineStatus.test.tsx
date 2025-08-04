import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOfflineStatus } from '../../../src/hooks/useOfflineStatus';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useOfflineStatus Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return online status initially', () => {
    const { result } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('should detect offline status when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const { result } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it('should update status when online event is fired', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const { result } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    expect(result.current.isOffline).toBe(true);

    // Simular evento online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('should update status when offline event is fired', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    const { result } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    expect(result.current.isOnline).toBe(true);

    // Simular evento offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it('should handle multiple status changes', () => {
    const { result } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    expect(result.current.isOnline).toBe(true);

    // Simular múltiples cambios de estado
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOffline).toBe(true);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOffline).toBe(true);
  });

  it('should handle network quality detection', () => {
    // Mock navigator.connection
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50
      }
    });

    const { result } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.networkQuality).toBeDefined();
  });

  it('should handle slow network detection', () => {
    // Mock navigator.connection para red lenta
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '2g',
        downlink: 0.5,
        rtt: 200
      }
    });

    const { result } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSlowConnection).toBe(true);
  });

  it('should handle network type detection', () => {
    // Mock diferentes tipos de red
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50
      }
    });

    const { result } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    expect(result.current.networkType).toBe('4g');
  });

  it('should handle missing navigator.connection gracefully', () => {
    // Simular navegador sin navigator.connection
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: undefined
    });

    const { result } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.networkQuality).toBe('unknown');
    expect(result.current.isSlowConnection).toBe(false);
  });

  it('should provide connection speed information', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '3g',
        downlink: 2.5,
        rtt: 100
      }
    });

    const { result } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    expect(result.current.connectionSpeed).toBe(2.5);
    expect(result.current.connectionLatency).toBe(100);
  });

  it('should handle connection changes', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50
      }
    });

    const { result } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    expect(result.current.networkType).toBe('4g');

    // Simular cambio de conexión
    act(() => {
      Object.defineProperty(navigator.connection, 'effectiveType', {
        writable: true,
        value: '3g'
      });
      Object.defineProperty(navigator.connection, 'downlink', {
        writable: true,
        value: 2.5
      });
      Object.defineProperty(navigator.connection, 'rtt', {
        writable: true,
        value: 100
      });
      
      // Disparar evento de cambio de conexión
      if (navigator.connection) {
        navigator.connection.dispatchEvent(new Event('change'));
      }
    });

    expect(result.current.networkType).toBe('3g');
    expect(result.current.connectionSpeed).toBe(2.5);
  });

  it('should handle network quality thresholds', () => {
    // Test con diferentes velocidades de conexión
    const testCases = [
      { downlink: 0.5, expected: 'slow' },
      { downlink: 2.0, expected: 'medium' },
      { downlink: 10.0, expected: 'fast' }
    ];

    testCases.forEach(({ downlink, expected }) => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '4g',
          downlink,
          rtt: 50
        }
      });

      const { result } = renderHook(() => useOfflineStatus(), {
        wrapper: TestWrapper
      });

      expect(result.current.networkQuality).toBe(expected);
    });
  });

  it('should handle latency thresholds', () => {
    // Test con diferentes latencias
    const testCases = [
      { rtt: 20, expected: 'low' },
      { rtt: 100, expected: 'medium' },
      { rtt: 300, expected: 'high' }
    ];

    testCases.forEach(({ rtt, expected }) => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '4g',
          downlink: 10,
          rtt
        }
      });

      const { result } = renderHook(() => useOfflineStatus(), {
        wrapper: TestWrapper
      });

      expect(result.current.connectionLatency).toBe(rtt);
    });
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should handle edge cases with undefined navigator', () => {
    // Simular navegador sin propiedades de red
    const originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: {
        onLine: true
      }
    });

    const { result } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.networkQuality).toBe('unknown');

    // Restaurar navigator original
    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: originalNavigator
    });
  });

  it('should provide network status summary', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50
      }
    });

    const { result } = renderHook(() => useOfflineStatus(), {
      wrapper: TestWrapper
    });

    expect(result.current.networkStatus).toEqual({
      isOnline: true,
      isOffline: false,
      networkType: '4g',
      networkQuality: 'fast',
      connectionSpeed: 10,
      connectionLatency: 50,
      isSlowConnection: false
    });
  });
}); 