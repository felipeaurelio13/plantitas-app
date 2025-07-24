import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Settings } from '../../../src/pages/Settings';

// Mock de hooks y servicios
const baseSettings = {
  notifications: {
    enabled: true,
    wateringReminders: true,
    healthAlerts: true,
    growthUpdates: true
  },
  theme: {
    mode: 'light',
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

vi.mock('../../../src/hooks/useSettings', () => ({
  useSettings: vi.fn(() => ({
    settings: { ...baseSettings },
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
    isLoading: false,
    error: null
  }))
}));

vi.mock('../../../src/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true,
    signOut: vi.fn()
  }))
}));

vi.mock('../../../src/components/ui/Toast', () => ({
  useToast: () => ({
    addToast: vi.fn()
  })
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render settings page', () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    // Verificar elementos principales de la página de configuraciones
    expect(screen.getByText(/configuraciones/i)).toBeInTheDocument();
    expect(screen.getByText(/notificaciones/i)).toBeInTheDocument();
    expect(screen.getByText(/tema/i)).toBeInTheDocument();
    expect(screen.getByText(/privacidad/i)).toBeInTheDocument();
    expect(screen.getByText(/accesibilidad/i)).toBeInTheDocument();
  });

  it('should display notification settings', () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    // Verificar configuraciones de notificaciones
    expect(screen.getByText(/notificaciones generales/i)).toBeInTheDocument();
    expect(screen.getByText(/recordatorios de riego/i)).toBeInTheDocument();
    expect(screen.getByText(/alertas de salud/i)).toBeInTheDocument();
    expect(screen.getByText(/actualizaciones de crecimiento/i)).toBeInTheDocument();
  });

  it('should display theme settings', () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    // Verificar configuraciones de tema
    expect(screen.getByText(/modo oscuro/i)).toBeInTheDocument();
    expect(screen.getByText(/color primario/i)).toBeInTheDocument();
    expect(screen.getByText(/color de acento/i)).toBeInTheDocument();
  });

  it('should display privacy settings', () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    // Verificar configuraciones de privacidad
    expect(screen.getByText(/compartir datos/i)).toBeInTheDocument();
    expect(screen.getByText(/analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/reportes de errores/i)).toBeInTheDocument();
  });

  it('should display accessibility settings', () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    // Verificar configuraciones de accesibilidad
    expect(screen.getByText(/alto contraste/i)).toBeInTheDocument();
    expect(screen.getByText(/texto grande/i)).toBeInTheDocument();
    expect(screen.getByText(/movimiento reducido/i)).toBeInTheDocument();
  });

  it('should handle notification toggle', async () => {
    const mockUpdateSettings = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useSettings').useSettings).mockReturnValue({
      settings: {
        notifications: {
          enabled: true,
          wateringReminders: true,
          healthAlerts: true,
          growthUpdates: true
        },
        theme: {
          mode: 'light',
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
      },
      updateSettings: mockUpdateSettings,
      resetSettings: vi.fn(),
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    const notificationToggle = screen.getByRole('switch', { name: /notificaciones generales/i });
    fireEvent.click(notificationToggle);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      notifications: {
        enabled: false,
        wateringReminders: true,
        healthAlerts: true,
        growthUpdates: true
      },
      theme: {
        mode: 'light',
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
    });
  });

  it('should handle theme mode toggle', async () => {
    const mockUpdateSettings = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useSettings').useSettings).mockReturnValue({
      settings: {
        notifications: {
          enabled: true,
          wateringReminders: true,
          healthAlerts: true,
          growthUpdates: true
        },
        theme: {
          mode: 'light',
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
      },
      updateSettings: mockUpdateSettings,
      resetSettings: vi.fn(),
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    const themeToggle = screen.getByRole('switch', { name: /modo oscuro/i });
    fireEvent.click(themeToggle);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      notifications: {
        enabled: true,
        wateringReminders: true,
        healthAlerts: true,
        growthUpdates: true
      },
      theme: {
        mode: 'dark',
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
    });
  });

  it('should handle privacy settings toggle', async () => {
    const mockUpdateSettings = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useSettings').useSettings).mockReturnValue({
      settings: {
        notifications: {
          enabled: true,
          wateringReminders: true,
          healthAlerts: true,
          growthUpdates: true
        },
        theme: {
          mode: 'light',
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
      },
      updateSettings: mockUpdateSettings,
      resetSettings: vi.fn(),
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    const analyticsToggle = screen.getByRole('switch', { name: /analytics/i });
    fireEvent.click(analyticsToggle);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      notifications: {
        enabled: true,
        wateringReminders: true,
        healthAlerts: true,
        growthUpdates: true
      },
      theme: {
        mode: 'light',
        primaryColor: '#10b981',
        accentColor: '#059669'
      },
      privacy: {
        dataSharing: false,
        analytics: false,
        crashReports: false
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        reducedMotion: true
      }
    });
  });

  it('should handle accessibility settings toggle', async () => {
    const mockUpdateSettings = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useSettings').useSettings).mockReturnValue({
      settings: {
        notifications: {
          enabled: true,
          wateringReminders: true,
          healthAlerts: true,
          growthUpdates: true
        },
        theme: {
          mode: 'light',
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
      },
      updateSettings: mockUpdateSettings,
      resetSettings: vi.fn(),
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    const highContrastToggle = screen.getByRole('switch', { name: /alto contraste/i });
    fireEvent.click(highContrastToggle);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      notifications: {
        enabled: true,
        wateringReminders: true,
        healthAlerts: true,
        growthUpdates: true
      },
      theme: {
        mode: 'light',
        primaryColor: '#10b981',
        accentColor: '#059669'
      },
      privacy: {
        dataSharing: false,
        analytics: true,
        crashReports: false
      },
      accessibility: {
        highContrast: true,
        largeText: false,
        reducedMotion: true
      }
    });
  });

  it('should handle settings reset', async () => {
    const mockResetSettings = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useSettings').useSettings).mockReturnValue({
      settings: {
        notifications: {
          enabled: true,
          wateringReminders: true,
          healthAlerts: true,
          growthUpdates: true
        },
        theme: {
          mode: 'light',
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
      },
      updateSettings: vi.fn(),
      resetSettings: mockResetSettings,
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    const resetButton = screen.getByRole('button', { name: /restablecer/i });
    fireEvent.click(resetButton);

    expect(mockResetSettings).toHaveBeenCalled();
  });

  it('should handle loading state', () => {
    vi.mocked(require('../../../src/hooks/useSettings').useSettings).mockReturnValue({
      settings: {
        notifications: {
          enabled: true,
          wateringReminders: true,
          healthAlerts: true,
          growthUpdates: true
        },
        theme: {
          mode: 'light',
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
      },
      updateSettings: vi.fn(),
      resetSettings: vi.fn(),
      isLoading: true,
      error: null
    });

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('should handle error state', () => {
    vi.mocked(require('../../../src/hooks/useSettings').useSettings).mockReturnValue({
      settings: {
        notifications: {
          enabled: true,
          wateringReminders: true,
          healthAlerts: true,
          growthUpdates: true
        },
        theme: {
          mode: 'light',
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
      },
      updateSettings: vi.fn(),
      resetSettings: vi.fn(),
      isLoading: false,
      error: new Error('Failed to load settings')
    });

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('should handle sign out', () => {
    const mockSignOut = vi.fn();
    
    vi.mocked(require('../../../src/stores/useAuthStore').useAuthStore).mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      isAuthenticated: true,
      signOut: mockSignOut
    });

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    const signOutButton = screen.getByRole('button', { name: /cerrar sesión/i });
    fireEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should display user information', () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/test-user/i)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    const switches = screen.getAllByRole('switch');
    switches.forEach(switchElement => {
      expect(switchElement).toHaveAttribute('aria-label');
    });

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('should handle color picker changes', async () => {
    const mockUpdateSettings = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useSettings').useSettings).mockReturnValue({
      settings: {
        notifications: {
          enabled: true,
          wateringReminders: true,
          healthAlerts: true,
          growthUpdates: true
        },
        theme: {
          mode: 'light',
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
      },
      updateSettings: mockUpdateSettings,
      resetSettings: vi.fn(),
      isLoading: false,
      error: null
    });

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    );

    const primaryColorInput = screen.getByDisplayValue('#10b981');
    fireEvent.change(primaryColorInput, { target: { value: '#3b82f6' } });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      notifications: {
        enabled: true,
        wateringReminders: true,
        healthAlerts: true,
        growthUpdates: true
      },
      theme: {
        mode: 'light',
        primaryColor: '#3b82f6',
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
    });
  });
}); 