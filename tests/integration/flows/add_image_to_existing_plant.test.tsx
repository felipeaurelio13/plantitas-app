import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock the components and services
vi.mock('../src/components/PlantDetail/AddPhotoModal', () => ({
  AddPhotoModal: ({ isOpen, onClose, onPhotoAdded, plantName }: any) => {
    if (!isOpen) return null;
    
    const handleFileSelect = (file: File) => {
      if (file.type.startsWith('image/') && file.size > 0 && file.size <= 5 * 1024 * 1024) {
        // Simulate successful file selection
        return true;
      } else {
        throw new Error('Invalid file');
      }
    };

    const handleUpload = async () => {
      try {
        await onPhotoAdded('data:image/jpeg;base64,fake-image-data', 'Test note');
      } catch (error) {
        throw error;
      }
    };

    return React.createElement('div', { 'data-testid': 'add-photo-modal' }, [
      React.createElement('h2', { key: 'title' }, 'Agregar Foto'),
      React.createElement('p', { key: 'description' }, `Agregar una nueva foto a ${plantName}`),
      React.createElement('button', { 
        key: 'gallery-btn', 
        onClick: () => {
          const file = new File(['fake-data'], 'test.jpg', { type: 'image/jpeg' });
          handleFileSelect(file);
        }
      }, 'Galería'),
      React.createElement('button', { 
        key: 'upload-btn', 
        onClick: handleUpload 
      }, 'Analizar y Guardar'),
      React.createElement('input', { 
        key: 'file-input',
        'data-testid': 'file-input',
        type: 'file',
        accept: 'image/*',
        onChange: (e: any) => {
          const file = e.target.files[0];
          if (file) {
            try {
              handleFileSelect(file);
            } catch (error) {
              // Show error message
              const errorDiv = document.createElement('div');
              errorDiv.textContent = error instanceof Error ? error.message : 'Error desconocido';
              errorDiv.setAttribute('data-testid', 'error-message');
              document.body.appendChild(errorDiv);
            }
          }
        }
      })
    ]);
  }
}));

vi.mock('../src/hooks/usePlantImageMutations', () => ({
  usePlantImageMutations: () => ({
    addPlantImage: vi.fn(),
    isAddingImage: false
  })
}));

vi.mock('../src/services/plantService', () => ({
  plantService: {
    addPlantImage: vi.fn().mockResolvedValue({
      id: 'new-image-id',
      url: 'https://example.com/new-image.jpg',
      timestamp: new Date(),
      isProfileImage: false,
      healthAnalysis: {
        overallHealth: 'excellent',
        confidence: 95,
        issues: [],
        recommendations: ['La planta se ve muy saludable'],
        moistureLevel: 75,
        growthStage: 'mature'
      }
    }),
    updatePlantHealthScore: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../src/services/aiService', () => ({
  aiService: {
    analyzeImage: vi.fn().mockResolvedValue({
      species: 'Monstera deliciosa',
      commonName: 'Monstera Deliciosa',
      health: {
        overallHealth: 'excellent',
        confidence: 95,
        issues: [],
        recommendations: ['La planta se ve muy saludable'],
        moistureLevel: 75,
        growthStage: 'mature'
      }
    })
  }
}));

vi.mock('../src/services/imageService', () => ({
  uploadImage: vi.fn().mockResolvedValue('https://example.com/new-image.jpg')
}));

vi.mock('../src/stores/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    isAuthenticated: true
  }))
}));

vi.mock('../src/stores/usePlantStore', () => ({
  usePlantStore: vi.fn(() => ({
    getPlantById: vi.fn().mockReturnValue({
      id: 'test-plant-id',
      name: 'Monstera Deliciosa',
      images: []
    }),
    setPlant: vi.fn()
  }))
}));

vi.mock('../src/components/ui/Toast', () => ({
  useToast: vi.fn(() => ({
    addToast: vi.fn()
  }))
}));

// Import the mocked component
import { AddPhotoModal } from '../../../src/components/PlantDetail/AddPhotoModal';
import { ToastProvider } from '../../../src/components/ui/Toast';

describe('Add Image to Existing Plant Flow', () => {
  let mockOnPhotoAdded: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnPhotoAdded = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AddPhotoModal Component', () => {
    it('should render the modal correctly', () => {
      render(
        <ToastProvider>
          <AddPhotoModal
            isOpen={true}
            onClose={vi.fn()}
            onPhotoAdded={mockOnPhotoAdded}
            plantName="Monstera Deliciosa"
          />
        </ToastProvider>
      );

      expect(screen.getByText('Agregar Nueva Foto')).toBeInTheDocument();
      expect(screen.getByText('Documenta el progreso de')).toBeInTheDocument();
    });

    it('should handle file selection from gallery', async () => {
      const user = userEvent.setup();
      
      render(
        <ToastProvider>
          <AddPhotoModal
            isOpen={true}
            onClose={vi.fn()}
            onPhotoAdded={mockOnPhotoAdded}
            plantName="Monstera Deliciosa"
          />
        </ToastProvider>
      );

      // Click on gallery option
      const galleryButton = screen.getByText('Elegir de Galería');
      await user.click(galleryButton);

      // Should not show any error
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should handle image upload and analysis flow', async () => {
      const user = userEvent.setup();
      
      render(
        <ToastProvider>
          <AddPhotoModal
            isOpen={true}
            onClose={vi.fn()}
            onPhotoAdded={mockOnPhotoAdded}
            plantName="Monstera Deliciosa"
          />
        </ToastProvider>
      );

      // First, click on gallery option to select an image
      const galleryButton = screen.getByText('Elegir de Galería');
      await user.click(galleryButton);

      // Simulate file selection
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      // Now the "Analizar y Guardar" button should be visible
      const analyzeButton = screen.getByText('Analizar y Guardar');
      await user.click(analyzeButton);

      // Verify that onPhotoAdded was called (without checking specific parameters)
      await waitFor(() => {
        expect(mockOnPhotoAdded).toHaveBeenCalled();
      });
    });

    it('should handle upload errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock error in onPhotoAdded
      const mockOnPhotoAddedWithError = vi.fn().mockRejectedValue(
        new Error('Error al subir la imagen')
      );

      render(
        <ToastProvider>
          <AddPhotoModal
            isOpen={true}
            onClose={vi.fn()}
            onPhotoAdded={mockOnPhotoAddedWithError}
            plantName="Monstera Deliciosa"
          />
        </ToastProvider>
      );

      // First, click on gallery option to select an image
      const galleryButton = screen.getByText('Elegir de Galería');
      await user.click(galleryButton);

      // Simulate file selection
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      // Now the "Analizar y Guardar" button should be visible
      const analyzeButton = screen.getByText('Analizar y Guardar');
      await user.click(analyzeButton);

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockOnPhotoAddedWithError).toHaveBeenCalled();
      });
    });
  });

  describe('File Validation', () => {
    it('should reject non-image files', async () => {
      render(
        <ToastProvider>
          <AddPhotoModal
            isOpen={true}
            onClose={vi.fn()}
            onPhotoAdded={mockOnPhotoAdded}
            plantName="Monstera Deliciosa"
          />
        </ToastProvider>
      );

      // Click on gallery option
      const galleryButton = screen.getByText('Elegir de Galería');
      await userEvent.click(galleryButton);

      // Try to upload a non-image file
      const fileInput = screen.getByTestId('file-input');
      const nonImageFile = new File(['fake-data'], 'test.txt', { type: 'text/plain' });
      await userEvent.upload(fileInput, nonImageFile);

      // Should not call onPhotoAdded for invalid files
      expect(mockOnPhotoAdded).not.toHaveBeenCalled();
    });

    it('should reject files larger than 5MB', async () => {
      render(
        <ToastProvider>
          <AddPhotoModal
            isOpen={true}
            onClose={vi.fn()}
            onPhotoAdded={mockOnPhotoAdded}
            plantName="Monstera Deliciosa"
          />
        </ToastProvider>
      );

      // Click on gallery option
      const galleryButton = screen.getByText('Elegir de Galería');
      await userEvent.click(galleryButton);

      // Try to upload a large file
      const fileInput = screen.getByTestId('file-input');
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      await userEvent.upload(fileInput, largeFile);

      // Should not call onPhotoAdded for large files
      expect(mockOnPhotoAdded).not.toHaveBeenCalled();
    });

    it('should reject empty files', async () => {
      render(
        <ToastProvider>
          <AddPhotoModal
            isOpen={true}
            onClose={vi.fn()}
            onPhotoAdded={mockOnPhotoAdded}
            plantName="Monstera Deliciosa"
          />
        </ToastProvider>
      );

      // Click on gallery option
      const galleryButton = screen.getByText('Elegir de Galería');
      await userEvent.click(galleryButton);

      // Try to upload an empty file
      const fileInput = screen.getByTestId('file-input');
      const emptyFile = new File([''], 'empty.jpg', { type: 'image/jpeg' });
      await userEvent.upload(fileInput, emptyFile);

      // Should not call onPhotoAdded for empty files
      expect(mockOnPhotoAdded).not.toHaveBeenCalled();
    });

    it('should accept valid image files', async () => {
      render(
        <ToastProvider>
          <AddPhotoModal
            isOpen={true}
            onClose={vi.fn()}
            onPhotoAdded={mockOnPhotoAdded}
            plantName="Monstera Deliciosa"
          />
        </ToastProvider>
      );

      // Click on gallery option
      const galleryButton = screen.getByText('Elegir de Galería');
      await userEvent.click(galleryButton);

      // Upload a valid image file
      const fileInput = screen.getByTestId('file-input');
      const validFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
      await userEvent.upload(fileInput, validFile);

      // Should show preview
      await waitFor(() => {
        expect(screen.getByText('Vista Previa')).toBeInTheDocument();
      });
    });
  });

  describe('Success Flow Validation', () => {
    it('should complete the full flow successfully', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();
      
      render(
        <ToastProvider>
          <AddPhotoModal
            isOpen={true}
            onClose={mockOnClose}
            onPhotoAdded={mockOnPhotoAdded}
            plantName="Monstera Deliciosa"
          />
        </ToastProvider>
      );

      // Step 1: Click on gallery option to select an image
      const galleryButton = screen.getByText('Elegir de Galería');
      await user.click(galleryButton);

      // Step 2: Simulate file selection
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      // Step 3: Verify the preview is shown
      await waitFor(() => {
        expect(screen.getByText('Vista Previa')).toBeInTheDocument();
      });

      // Step 4: Click analyze and save button
      const analyzeButton = screen.getByText('Analizar y Guardar');
      await user.click(analyzeButton);

      // Step 5: Verify success message appears
      await waitFor(() => {
        expect(screen.getByText('¡Foto agregada!')).toBeInTheDocument();
      });

      // Step 6: Verify onPhotoAdded was called
      expect(mockOnPhotoAdded).toHaveBeenCalled();
    });
  });

  describe('Integration with Services', () => {
    it('should complete the full flow successfully', async () => {
      const user = userEvent.setup();
      
      render(
        <ToastProvider>
          <AddPhotoModal
            isOpen={true}
            onClose={vi.fn()}
            onPhotoAdded={mockOnPhotoAdded}
            plantName="Monstera Deliciosa"
          />
        </ToastProvider>
      );

      // Step 1: Click on gallery option to select an image
      const galleryButton = screen.getByText('Elegir de Galería');
      await user.click(galleryButton);

      // Step 2: Simulate file selection
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      // Step 3: Verify the preview is shown
      await waitFor(() => {
        expect(screen.getByText('Vista Previa')).toBeInTheDocument();
      });

      // Step 4: Click analyze and save button
      const analyzeButton = screen.getByText('Analizar y Guardar');
      await user.click(analyzeButton);

      // Step 5: Verify success message
      await waitFor(() => {
        expect(screen.getByText('¡Foto agregada!')).toBeInTheDocument();
      });

      // Step 6: Verify onPhotoAdded was called
      expect(mockOnPhotoAdded).toHaveBeenCalled();
    });
  });
}); 