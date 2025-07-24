import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CameraCaptureView } from '../../../src/components/camera/CameraCaptureView';

// Mock de hooks y servicios
vi.mock('../../../src/hooks/useCamera', () => ({
  useCamera: () => ({
    stream: null,
    isStreamActive: false,
    error: null,
    startCamera: vi.fn(),
    stopCamera: vi.fn(),
    capturePhoto: vi.fn(),
    isCapturing: false
  })
}));

vi.mock('../../../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
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

describe('CameraCaptureView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render camera interface', () => {
    render(
      <TestWrapper>
        <CameraCaptureView />
      </TestWrapper>
    );

    // Verificar elementos de la interfaz de cámara
    expect(screen.getByText(/cámara/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /capturar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
  });

  it('should display camera preview when stream is active', () => {
    // Mock el hook para retornar stream activo
    vi.mocked(require('../../../src/hooks/useCamera').useCamera).mockReturnValue({
      stream: 'mock-stream',
      isStreamActive: true,
      error: null,
      startCamera: vi.fn(),
      stopCamera: vi.fn(),
      capturePhoto: vi.fn(),
      isCapturing: false
    });

    render(
      <TestWrapper>
        <CameraCaptureView />
      </TestWrapper>
    );

    // Verificar que se muestra el preview de la cámara
    expect(screen.getByTestId('camera-preview')).toBeInTheDocument();
  });

  it('should display error state when camera fails', () => {
    // Mock el hook para retornar error
    vi.mocked(require('../../../src/hooks/useCamera').useCamera).mockReturnValue({
      stream: null,
      isStreamActive: false,
      error: new Error('Camera access denied'),
      startCamera: vi.fn(),
      stopCamera: vi.fn(),
      capturePhoto: vi.fn(),
      isCapturing: false
    });

    render(
      <TestWrapper>
        <CameraCaptureView />
      </TestWrapper>
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/Camera access denied/i)).toBeInTheDocument();
  });

  it('should handle capture photo action', async () => {
    const mockCapturePhoto = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useCamera').useCamera).mockReturnValue({
      stream: 'mock-stream',
      isStreamActive: true,
      error: null,
      startCamera: vi.fn(),
      stopCamera: vi.fn(),
      capturePhoto: mockCapturePhoto,
      isCapturing: false
    });

    render(
      <TestWrapper>
        <CameraCaptureView />
      </TestWrapper>
    );

    const captureButton = screen.getByRole('button', { name: /capturar/i });
    fireEvent.click(captureButton);

    expect(mockCapturePhoto).toHaveBeenCalled();
  });

  it('should show loading state when capturing', () => {
    vi.mocked(require('../../../src/hooks/useCamera').useCamera).mockReturnValue({
      stream: 'mock-stream',
      isStreamActive: true,
      error: null,
      startCamera: vi.fn(),
      stopCamera: vi.fn(),
      capturePhoto: vi.fn(),
      isCapturing: true
    });

    render(
      <TestWrapper>
        <CameraCaptureView />
      </TestWrapper>
    );

    expect(screen.getByText(/capturando/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /capturar/i })).toBeDisabled();
  });

  it('should handle camera start on mount', () => {
    const mockStartCamera = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useCamera').useCamera).mockReturnValue({
      stream: null,
      isStreamActive: false,
      error: null,
      startCamera: mockStartCamera,
      stopCamera: vi.fn(),
      capturePhoto: vi.fn(),
      isCapturing: false
    });

    render(
      <TestWrapper>
        <CameraCaptureView />
      </TestWrapper>
    );

    expect(mockStartCamera).toHaveBeenCalled();
  });

  it('should handle camera stop on unmount', () => {
    const mockStopCamera = vi.fn();
    
    vi.mocked(require('../../../src/hooks/useCamera').useCamera).mockReturnValue({
      stream: null,
      isStreamActive: false,
      error: null,
      startCamera: vi.fn(),
      stopCamera: mockStopCamera,
      capturePhoto: vi.fn(),
      isCapturing: false
    });

    const { unmount } = render(
      <TestWrapper>
        <CameraCaptureView />
      </TestWrapper>
    );

    unmount();

    expect(mockStopCamera).toHaveBeenCalled();
  });

  it('should display camera controls', () => {
    vi.mocked(require('../../../src/hooks/useCamera').useCamera).mockReturnValue({
      stream: 'mock-stream',
      isStreamActive: true,
      error: null,
      startCamera: vi.fn(),
      stopCamera: vi.fn(),
      capturePhoto: vi.fn(),
      isCapturing: false
    });

    render(
      <TestWrapper>
        <CameraCaptureView />
      </TestWrapper>
    );

    // Verificar controles de cámara
    expect(screen.getByRole('button', { name: /capturar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
    expect(screen.getByTestId('camera-controls')).toBeInTheDocument();
  });

  it('should handle navigation back', () => {
    render(
      <TestWrapper>
        <CameraCaptureView />
      </TestWrapper>
    );

    const backButton = screen.getByRole('button', { name: /volver/i });
    fireEvent.click(backButton);

    // Verificar que se navega hacia atrás
    expect(backButton).toBeInTheDocument();
  });

  it('should display camera instructions', () => {
    render(
      <TestWrapper>
        <CameraCaptureView />
      </TestWrapper>
    );

    expect(screen.getByText(/posiciona tu planta/i)).toBeInTheDocument();
    expect(screen.getByText(/asegúrate de que esté bien iluminada/i)).toBeInTheDocument();
  });

  it('should handle permission denied gracefully', () => {
    vi.mocked(require('../../../src/hooks/useCamera').useCamera).mockReturnValue({
      stream: null,
      isStreamActive: false,
      error: new Error('Permission denied'),
      startCamera: vi.fn(),
      stopCamera: vi.fn(),
      capturePhoto: vi.fn(),
      isCapturing: false
    });

    render(
      <TestWrapper>
        <CameraCaptureView />
      </TestWrapper>
    );

    expect(screen.getByText(/permiso denegado/i)).toBeInTheDocument();
    expect(screen.getByText(/habilita el acceso a la cámara/i)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <CameraCaptureView />
      </TestWrapper>
    );

    const captureButton = screen.getByRole('button', { name: /capturar/i });
    const backButton = screen.getByRole('button', { name: /volver/i });

    expect(captureButton).toHaveAttribute('aria-label');
    expect(backButton).toHaveAttribute('aria-label');
  });
}); 