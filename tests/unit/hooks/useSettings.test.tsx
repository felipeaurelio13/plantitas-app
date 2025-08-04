import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettings } from '../../../src/hooks/useSettings';

// Mock de servicios
vi.mock('../../../src/services/settingsService', () => ({
  settingsService: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    resetSettings: vi.fn()
  }
}));

vi.mock('../../../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

const mockSettings = {
  notifications: {
    enabled: true,
    wateringReminders: true,
    healthAlerts: true,
    growthUpdates: true
  },
  theme: {
    mode: 'light' as const,
    primaryColor: '#10b981',
    accentColor: '#059669'
  },
  privacy: {
    dataSharing: false,
    analytics: true,
    crashReports: false
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    reducedMotion: true
  }
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useSettings Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return settings functions and state', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    expect(result.current.settings).toBeDefined();
    expect(result.current.updateSettings).toBeDefined();
    expect(result.current.resetSettings).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load settings on mount', async () => {
    const { settingsService } = await import('../../../src/services/settingsService');
    (settingsService.getSettings as any).mockResolvedValue(mockSettings);

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    expect(settingsService.getSettings).toHaveBeenCalled();
    expect(result.current.settings).toEqual(mockSettings);
  });

  it('should handle settings loading error', async () => {
    const { settingsService } = await import('../../../src/services/settingsService');
    const mockError = new Error('Failed to load settings');
    (settingsService.getSettings as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('should update settings successfully', async () => {
    const { settingsService } = await import('../../../src/services/settingsService');
    (settingsService.getSettings as any).mockResolvedValue(mockSettings);
    (settingsService.updateSettings as any).mockResolvedValue({
      ...mockSettings,
      theme: { ...mockSettings.theme, mode: 'dark' }
    });

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    const updatedSettings = {
      ...mockSettings,
      theme: { ...mockSettings.theme, mode: 'dark' as const }
    };

    await act(async () => {
      await result.current.updateSettings(updatedSettings);
    });

    expect(settingsService.updateSettings).toHaveBeenCalledWith(updatedSettings);
    expect(result.current.settings.theme.mode).toBe('dark');
  });

  it('should handle settings update error', async () => {
    const { settingsService } = await import('../../../src/services/settingsService');
    (settingsService.getSettings as any).mockResolvedValue(mockSettings);
    const mockError = new Error('Failed to update settings');
    (settingsService.updateSettings as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    const updatedSettings = {
      ...mockSettings,
      theme: { ...mockSettings.theme, mode: 'dark' as const }
    };

    await act(async () => {
      try {
        await result.current.updateSettings(updatedSettings);
      } catch (error) {
        expect(error).toEqual(mockError);
      }
    });
  });

  it('should reset settings to defaults', async () => {
    const { settingsService } = await import('../../../src/services/settingsService');
    const defaultSettings = {
      notifications: {
        enabled: true,
        wateringReminders: true,
        healthAlerts: true,
        growthUpdates: true
      },
      theme: {
        mode: 'light' as const,
        primaryColor: '#10b981',
        accentColor: '#059669'
      },
      privacy: {
        dataSharing: false,
        analytics: true,
        crashReports: false
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        reducedMotion: false
      }
    };

    (settingsService.getSettings as any).mockResolvedValue(mockSettings);
    (settingsService.resetSettings as any).mockResolvedValue(defaultSettings);

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    await act(async () => {
      await result.current.resetSettings();
    });

    expect(settingsService.resetSettings).toHaveBeenCalled();
    expect(result.current.settings).toEqual(defaultSettings);
  });

  it('should handle settings reset error', async () => {
    const { settingsService } = await import('../../../src/services/settingsService');
    (settingsService.getSettings as any).mockResolvedValue(mockSettings);
    const mockError = new Error('Failed to reset settings');
    (settingsService.resetSettings as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    await act(async () => {
      try {
        await result.current.resetSettings();
      } catch (error) {
        expect(error).toEqual(mockError);
      }
    });
  });

  it('should update notification settings', async () => {
    const { settingsService } = await import('../../../src/services/settingsService');
    (settingsService.getSettings as any).mockResolvedValue(mockSettings);
    (settingsService.updateSettings as any).mockResolvedValue({
      ...mockSettings,
      notifications: { ...mockSettings.notifications, enabled: false }
    });

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    const updatedSettings = {
      ...mockSettings,
      notifications: { ...mockSettings.notifications, enabled: false }
    };

    await act(async () => {
      await result.current.updateSettings(updatedSettings);
    });

    expect(result.current.settings.notifications.enabled).toBe(false);
  });

  it('should update theme settings', async () => {
    const { settingsService } = await import('../../../src/services/settingsService');
    (settingsService.getSettings as any).mockResolvedValue(mockSettings);
    (settingsService.updateSettings as any).mockResolvedValue({
      ...mockSettings,
      theme: { ...mockSettings.theme, primaryColor: '#3b82f6' }
    });

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    const updatedSettings = {
      ...mockSettings,
      theme: { ...mockSettings.theme, primaryColor: '#3b82f6' }
    };

    await act(async () => {
      await result.current.updateSettings(updatedSettings);
    });

    expect(result.current.settings.theme.primaryColor).toBe('#3b82f6');
  });

  it('should update privacy settings', async () => {
    const { settingsService } = await import('../../../src/services/settingsService');
    (settingsService.getSettings as any).mockResolvedValue(mockSettings);
    (settingsService.updateSettings as any).mockResolvedValue({
      ...mockSettings,
      privacy: { ...mockSettings.privacy, dataSharing: true }
    });

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    const updatedSettings = {
      ...mockSettings,
      privacy: { ...mockSettings.privacy, dataSharing: true }
    };

    await act(async () => {
      await result.current.updateSettings(updatedSettings);
    });

    expect(result.current.settings.privacy.dataSharing).toBe(true);
  });

  it('should update accessibility settings', async () => {
    const { settingsService } = await import('../../../src/services/settingsService');
    (settingsService.getSettings as any).mockResolvedValue(mockSettings);
    (settingsService.updateSettings as any).mockResolvedValue({
      ...mockSettings,
      accessibility: { ...mockSettings.accessibility, highContrast: true }
    });

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    const updatedSettings = {
      ...mockSettings,
      accessibility: { ...mockSettings.accessibility, highContrast: true }
    };

    await act(async () => {
      await result.current.updateSettings(updatedSettings);
    });

    expect(result.current.settings.accessibility.highContrast).toBe(true);
  });

  it('should handle partial settings updates', async () => {
    const { settingsService } = await import('../../../src/services/settingsService');
    (settingsService.getSettings as any).mockResolvedValue(mockSettings);
    (settingsService.updateSettings as any).mockResolvedValue({
      ...mockSettings,
      notifications: { ...mockSettings.notifications, wateringReminders: false }
    });

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    const partialUpdate = {
      notifications: { ...mockSettings.notifications, wateringReminders: false }
    };

    await act(async () => {
      await result.current.updateSettings(partialUpdate);
    });

    expect(result.current.settings.notifications.wateringReminders).toBe(false);
  });

  it('should handle loading states', async () => {
    const { settingsService } = await import('../../../src/services/settingsService');
    (settingsService.getSettings as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    expect(result.current.isLoading).toBe(true);

    // Esperar a que se complete la carga
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle network errors gracefully', async () => {
    const { settingsService } = await import('../../../src/services/settingsService');
    const networkError = new Error('Network error');
    (settingsService.getSettings as any).mockRejectedValue(networkError);

    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    expect(result.current.error).toEqual(networkError);
  });

  it('should validate settings structure', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: TestWrapper
    });

    expect(result.current.settings).toHaveProperty('notifications');
    expect(result.current.settings).toHaveProperty('theme');
    expect(result.current.settings).toHaveProperty('privacy');
    expect(result.current.settings).toHaveProperty('accessibility');
  });
}); 