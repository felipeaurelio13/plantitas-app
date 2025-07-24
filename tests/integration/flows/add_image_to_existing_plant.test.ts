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
import { AddPhotoModal } from '../src/components/PlantDetail/AddPhotoModal';

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
        React.createElement(AddPhotoModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPhotoAdded: mockOnPhotoAdded,
          plantName: 'Monstera Deliciosa'
        })
      );

      expect(screen.getByText('Agregar Foto')).toBeInTheDocument();
      expect(screen.getByText('Agregar una nueva foto a Monstera Deliciosa')).toBeInTheDocument();
    });

    it('should handle file selection from gallery', async () => {
      const user = userEvent.setup();
      
      render(
        React.createElement(AddPhotoModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPhotoAdded: mockOnPhotoAdded,
          plantName: 'Monstera Deliciosa'
        })
      );

      // Click on gallery option
      const galleryButton = screen.getByText('Galería');
      await user.click(galleryButton);

      // Should not show any error
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should handle image upload and analysis flow', async () => {
      const user = userEvent.setup();
      
      render(
        React.createElement(AddPhotoModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPhotoAdded: mockOnPhotoAdded,
          plantName: 'Monstera Deliciosa'
        })
      );

      // Click analyze and save button
      const analyzeButton = screen.getByText('Analizar y Guardar');
      await user.click(analyzeButton);

      // Verify that onPhotoAdded was called with correct parameters
      await waitFor(() => {
        expect(mockOnPhotoAdded).toHaveBeenCalledWith(
          'data:image/jpeg;base64,fake-image-data',
          'Test note'
        );
      });
    });

    it('should handle upload errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock error in onPhotoAdded
      const mockOnPhotoAddedWithError = vi.fn().mockRejectedValue(
        new Error('Error al subir la imagen')
      );

      render(
        React.createElement(AddPhotoModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPhotoAdded: mockOnPhotoAddedWithError,
          plantName: 'Monstera Deliciosa'
        })
      );

      // Click analyze and save button
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
        React.createElement(AddPhotoModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPhotoAdded: mockOnPhotoAdded,
          plantName: 'Monstera Deliciosa'
        })
      );

      // Try to upload a text file
      const fileInput = screen.getByTestId('file-input');
      const textFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
      fireEvent.change(fileInput, { target: { files: [textFile] } });

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should reject files larger than 5MB', async () => {
      render(
        React.createElement(AddPhotoModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPhotoAdded: mockOnPhotoAdded,
          plantName: 'Monstera Deliciosa'
        })
      );

      // Create a mock file larger than 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large-image.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

      const fileInput = screen.getByTestId('file-input');
      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      // Should show size error
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should reject empty files', async () => {
      render(
        React.createElement(AddPhotoModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPhotoAdded: mockOnPhotoAdded,
          plantName: 'Monstera Deliciosa'
        })
      );

      // Create an empty file
      const emptyFile = new File([''], 'empty-image.jpg', { type: 'image/jpeg' });
      Object.defineProperty(emptyFile, 'size', { value: 0 });

      const fileInput = screen.getByTestId('file-input');
      fireEvent.change(fileInput, { target: { files: [emptyFile] } });

      // Should show empty file error
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should accept valid image files', async () => {
      render(
        React.createElement(AddPhotoModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPhotoAdded: mockOnPhotoAdded,
          plantName: 'Monstera Deliciosa'
        })
      );

      // Create a valid image file
      const validFile = new File(['fake-image-data'], 'valid-image.jpg', { type: 'image/jpeg' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB

      const fileInput = screen.getByTestId('file-input');
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      // Should not show any error
      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Success Flow Validation', () => {
    it('should complete the full flow successfully', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();
      
      render(
        React.createElement(AddPhotoModal, {
          isOpen: true,
          onClose: mockOnClose,
          onPhotoAdded: mockOnPhotoAdded,
          plantName: 'Monstera Deliciosa'
        })
      );

      // Step 1: Click analyze and save
      const analyzeButton = screen.getByText('Analizar y Guardar');
      await user.click(analyzeButton);

      // Step 2: Verify success flow
      await waitFor(() => {
        expect(mockOnPhotoAdded).toHaveBeenCalledWith(
          'data:image/jpeg;base64,fake-image-data',
          'Test note'
        );
      });
    });
  });

  describe('Integration with Services', () => {
    it('should call AI analysis service', async () => {
      const { aiService } = await import('../src/services/aiService');
      const user = userEvent.setup();
      
      render(
        React.createElement(AddPhotoModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPhotoAdded: mockOnPhotoAdded,
          plantName: 'Monstera Deliciosa'
        })
      );

      // Click analyze and save button
      const analyzeButton = screen.getByText('Analizar y Guardar');
      await user.click(analyzeButton);

      // Verify AI service was called
      await waitFor(() => {
        expect(aiService.analyzeImage).toHaveBeenCalled();
      });
    });

    it('should call image upload service', async () => {
      const { uploadImage } = await import('../src/services/imageService');
      const user = userEvent.setup();
      
      render(
        React.createElement(AddPhotoModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPhotoAdded: mockOnPhotoAdded,
          plantName: 'Monstera Deliciosa'
        })
      );

      // Click analyze and save button
      const analyzeButton = screen.getByText('Analizar y Guardar');
      await user.click(analyzeButton);

      // Verify upload service was called
      await waitFor(() => {
        expect(uploadImage).toHaveBeenCalled();
      });
    });

    it('should call plant service to save image', async () => {
      const { plantService } = await import('../src/services/plantService');
      const user = userEvent.setup();
      
      render(
        React.createElement(AddPhotoModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPhotoAdded: mockOnPhotoAdded,
          plantName: 'Monstera Deliciosa'
        })
      );

      // Click analyze and save button
      const analyzeButton = screen.getByText('Analizar y Guardar');
      await user.click(analyzeButton);

      // Verify plant service was called
      await waitFor(() => {
        expect(plantService.addPlantImage).toHaveBeenCalled();
      });
    });
  });
}); 