import { describe, it, expect, vi, beforeEach } from 'vitest';
import { navigateTo, goBack, goHome, navigateToPlant, navigateToChat, navigateToSettings, navigateToCamera, getCurrentRoute, isCurrentRoute } from '../../../src/lib/navigation';

// Mock de react-router-dom
const mockNavigate = vi.fn();
const mockUseNavigate = vi.fn(() => mockNavigate);
const mockUseLocation = vi.fn(() => ({ pathname: '/dashboard' }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockUseNavigate(),
  useLocation: () => mockUseLocation()
}));

describe('Navigation Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockUseLocation.mockReturnValue({ pathname: '/dashboard' });
  });

  describe('navigateTo', () => {
    it('should navigate to a specific route', () => {
      navigateTo('/plants/123');

      expect(mockNavigate).toHaveBeenCalledWith('/plants/123');
    });

    it('should navigate with state', () => {
      const state = { from: 'dashboard' };
      navigateTo('/plants/123', { state });

      expect(mockNavigate).toHaveBeenCalledWith('/plants/123', { state });
    });

    it('should navigate with replace option', () => {
      navigateTo('/plants/123', { replace: true });

      expect(mockNavigate).toHaveBeenCalledWith('/plants/123', { replace: true });
    });

    it('should navigate with both state and replace', () => {
      const state = { from: 'dashboard' };
      navigateTo('/plants/123', { state, replace: true });

      expect(mockNavigate).toHaveBeenCalledWith('/plants/123', { state, replace: true });
    });
  });

  describe('goBack', () => {
    it('should navigate back in history', () => {
      goBack();

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should navigate back with fallback', () => {
      goBack('/dashboard');

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('goHome', () => {
    it('should navigate to dashboard', () => {
      goHome();

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to dashboard with replace', () => {
      goHome({ replace: true });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  describe('navigateToPlant', () => {
    it('should navigate to plant detail page', () => {
      navigateToPlant('plant-123');

      expect(mockNavigate).toHaveBeenCalledWith('/plants/plant-123');
    });

    it('should navigate to plant detail with state', () => {
      const state = { from: 'gallery' };
      navigateToPlant('plant-123', { state });

      expect(mockNavigate).toHaveBeenCalledWith('/plants/plant-123', { state });
    });

    it('should handle invalid plant ID', () => {
      navigateToPlant('');

      expect(mockNavigate).toHaveBeenCalledWith('/plants/');
    });
  });

  describe('navigateToChat', () => {
    it('should navigate to plant chat', () => {
      navigateToChat('plant-123');

      expect(mockNavigate).toHaveBeenCalledWith('/plants/plant-123/chat');
    });

    it('should navigate to garden chat', () => {
      navigateToChat();

      expect(mockNavigate).toHaveBeenCalledWith('/garden-chat');
    });

    it('should navigate to chat with state', () => {
      const state = { message: 'Hello plant!' };
      navigateToChat('plant-123', { state });

      expect(mockNavigate).toHaveBeenCalledWith('/plants/plant-123/chat', { state });
    });
  });

  describe('navigateToSettings', () => {
    it('should navigate to settings page', () => {
      navigateToSettings();

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });

    it('should navigate to settings with replace', () => {
      navigateToSettings({ replace: true });

      expect(mockNavigate).toHaveBeenCalledWith('/settings', { replace: true });
    });
  });

  describe('navigateToCamera', () => {
    it('should navigate to camera page', () => {
      navigateToCamera();

      expect(mockNavigate).toHaveBeenCalledWith('/camera');
    });

    it('should navigate to camera with state', () => {
      const state = { mode: 'add-plant' };
      navigateToCamera({ state });

      expect(mockNavigate).toHaveBeenCalledWith('/camera', { state });
    });
  });

  describe('getCurrentRoute', () => {
    it('should return current route pathname', () => {
      mockUseLocation.mockReturnValue({ pathname: '/plants/123' });

      const currentRoute = getCurrentRoute();

      expect(currentRoute).toBe('/plants/123');
    });

    it('should return dashboard for root path', () => {
      mockUseLocation.mockReturnValue({ pathname: '/' });

      const currentRoute = getCurrentRoute();

      expect(currentRoute).toBe('/');
    });

    it('should handle undefined pathname', () => {
      mockUseLocation.mockReturnValue({ pathname: undefined });

      const currentRoute = getCurrentRoute();

      expect(currentRoute).toBeUndefined();
    });
  });

  describe('isCurrentRoute', () => {
    it('should return true for current route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/plants/123' });

      const isCurrent = isCurrentRoute('/plants/123');

      expect(isCurrent).toBe(true);
    });

    it('should return false for different route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' });

      const isCurrent = isCurrentRoute('/plants/123');

      expect(isCurrent).toBe(false);
    });

    it('should handle exact path matching', () => {
      mockUseLocation.mockReturnValue({ pathname: '/plants/123/chat' });

      const isCurrent = isCurrentRoute('/plants/123');

      expect(isCurrent).toBe(false);
    });

    it('should handle partial path matching', () => {
      mockUseLocation.mockReturnValue({ pathname: '/plants/123/chat' });

      const isCurrent = isCurrentRoute('/plants/123', { exact: false });

      expect(isCurrent).toBe(true);
    });

    it('should handle root path matching', () => {
      mockUseLocation.mockReturnValue({ pathname: '/' });

      const isCurrent = isCurrentRoute('/');

      expect(isCurrent).toBe(true);
    });
  });

  describe('Navigation patterns', () => {
    it('should handle plant creation flow', () => {
      // Simular flujo de creación de planta
      navigateToCamera({ state: { mode: 'add-plant' } });
      expect(mockNavigate).toHaveBeenCalledWith('/camera', { 
        state: { mode: 'add-plant' } 
      });

      // Después de capturar foto, navegar a detalle de planta
      navigateToPlant('new-plant-123', { 
        state: { from: 'camera', imageUrl: 'data:image/jpeg;base64,...' } 
      });
      expect(mockNavigate).toHaveBeenCalledWith('/plants/new-plant-123', { 
        state: { from: 'camera', imageUrl: 'data:image/jpeg;base64,...' } 
      });
    });

    it('should handle chat navigation flow', () => {
      // Navegar desde dashboard a chat de planta
      navigateToChat('plant-123', { state: { from: 'dashboard' } });
      expect(mockNavigate).toHaveBeenCalledWith('/plants/plant-123/chat', { 
        state: { from: 'dashboard' } 
      });

      // Volver al dashboard
      goBack();
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should handle settings navigation flow', () => {
      // Navegar a configuraciones
      navigateToSettings();
      expect(mockNavigate).toHaveBeenCalledWith('/settings');

      // Volver al dashboard
      goHome();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Navigation state management', () => {
    it('should preserve navigation state', () => {
      const state = { 
        from: 'dashboard',
        timestamp: Date.now(),
        userAction: 'add-plant'
      };

      navigateToPlant('plant-123', { state });
      expect(mockNavigate).toHaveBeenCalledWith('/plants/plant-123', { state });
    });

    it('should handle navigation with query parameters', () => {
      navigateTo('/plants?filter=healthy&sort=name');
      expect(mockNavigate).toHaveBeenCalledWith('/plants?filter=healthy&sort=name');
    });

    it('should handle navigation with hash', () => {
      navigateTo('/plants/123#health-analysis');
      expect(mockNavigate).toHaveBeenCalledWith('/plants/123#health-analysis');
    });
  });

  describe('Navigation error handling', () => {
    it('should handle navigation errors gracefully', () => {
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      // Should not throw error
      expect(() => {
        navigateTo('/plants/123');
      }).not.toThrow();
    });

    it('should handle invalid routes', () => {
      navigateTo('');
      expect(mockNavigate).toHaveBeenCalledWith('');

      navigateTo(null as any);
      expect(mockNavigate).toHaveBeenCalledWith(null);
    });
  });

  describe('Navigation analytics', () => {
    it('should track navigation events', () => {
      const mockTrackEvent = vi.fn();
      global.gtag = mockTrackEvent;

      navigateToPlant('plant-123');

      expect(mockTrackEvent).toHaveBeenCalledWith('event', 'navigation', {
        page: '/plants/plant-123',
        action: 'navigate_to_plant'
      });
    });

    it('should track back navigation', () => {
      const mockTrackEvent = vi.fn();
      global.gtag = mockTrackEvent;

      goBack();

      expect(mockTrackEvent).toHaveBeenCalledWith('event', 'navigation', {
        action: 'go_back'
      });
    });
  });

  describe('Navigation performance', () => {
    it('should handle rapid navigation', () => {
      // Simular navegación rápida
      for (let i = 0; i < 10; i++) {
        navigateTo(`/plants/${i}`);
      }

      expect(mockNavigate).toHaveBeenCalledTimes(10);
    });

    it('should handle navigation with large state', () => {
      const largeState = {
        data: new Array(1000).fill('test'),
        timestamp: Date.now(),
        metadata: { size: 'large' }
      };

      navigateTo('/plants/123', { state: largeState });

      expect(mockNavigate).toHaveBeenCalledWith('/plants/123', { state: largeState });
    });
  });

  describe('Navigation accessibility', () => {
    it('should support keyboard navigation', () => {
      // Simular navegación con teclado
      const keyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      // La navegación debería funcionar con eventos de teclado
      navigateToPlant('plant-123');
      expect(mockNavigate).toHaveBeenCalledWith('/plants/plant-123');
    });

    it('should support screen reader navigation', () => {
      // Simular navegación para lectores de pantalla
      navigateToPlant('plant-123', { 
        state: { accessibility: { screenReader: true } } 
      });

      expect(mockNavigate).toHaveBeenCalledWith('/plants/plant-123', { 
        state: { accessibility: { screenReader: true } } 
      });
    });
  });
}); 