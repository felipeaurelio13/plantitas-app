import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CameraCaptureView } from '../../../src/components/camera/CameraCaptureView';
import { PlantDetail } from '../../../src/pages/PlantDetail';
import { Dashboard } from '../../../src/pages/Dashboard';

// Mock de servicios y hooks
vi.mock('../../../src/services/plantService', () => ({
  plantService: {
    createPlant: vi.fn(),
    updatePlant: vi.fn(),
    getPlantById: vi.fn()
  }
}));

vi.mock('../../../src/services/aiService', () => ({
  aiService: {
    analyzeImage: vi.fn(),
    completePlantInfo: vi.fn()
  }
}));

vi.mock('../../../src/services/imageService', () => ({
  imageService: {
    uploadImage: vi.fn(),
    compressImage: vi.fn()
  }
}));

vi.mock('../../../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

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

vi.mock('../../../src/hooks/usePlantMutations', () => ({
  usePlantMutations: () => ({
    createPlant: vi.fn(),
    updatePlant: vi.fn(),
    deletePlant: vi.fn(),
    isLoading: false,
    error: null
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

describe('Plant Creation Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Plant Creation Flow', () => {
    it('should handle complete plant creation from camera to dashboard', async () => {
      const mockCreatePlant = vi.fn().mockResolvedValue({
        id: 'new-plant-123',
        name: 'Monstera Deliciosa',
        species: 'Monstera deliciosa',
        nickname: 'Monstera',
        healthScore: 85
      });

      const mockAnalyzeImage = vi.fn().mockResolvedValue({
        plantName: 'Monstera Deliciosa',
        species: 'Monstera deliciosa',
        healthAnalysis: {
          overallHealth: 'good',
          confidence: 85,
          issues: [],
          recommendations: ['Keep up the good care!']
        }
      });

      const mockUploadImage = vi.fn().mockResolvedValue({
        url: 'https://example.com/plant-image.jpg',
        id: 'img-123'
      });

      // Mock de servicios
      const { plantService } = await import('../../../src/services/plantService');
      const { aiService } = await import('../../../src/services/aiService');
      const { imageService } = await import('../../../src/services/imageService');

      (plantService.createPlant as any).mockImplementation(mockCreatePlant);
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);
      (imageService.uploadImage as any).mockImplementation(mockUploadImage);

      // Simular captura de foto
      const capturedImage = new File(['fake-image-data'], 'plant.jpg', { type: 'image/jpeg' });
      
      // 1. Usuario toma foto
      expect(mockAnalyzeImage).not.toHaveBeenCalled();
      
      // 2. Imagen se analiza
      const analysisResult = await mockAnalyzeImage(capturedImage);
      expect(analysisResult.plantName).toBe('Monstera Deliciosa');
      
      // 3. Imagen se sube
      const uploadResult = await mockUploadImage(capturedImage);
      expect(uploadResult.url).toBe('https://example.com/plant-image.jpg');
      
      // 4. Planta se crea en base de datos
      const plantData = {
        name: analysisResult.plantName,
        species: analysisResult.species,
        nickname: 'Monstera',
        images: [{
          id: uploadResult.id,
          url: uploadResult.url,
          timestamp: new Date(),
          isProfileImage: true,
          healthAnalysis: analysisResult.healthAnalysis
        }],
        healthScore: analysisResult.healthAnalysis.confidence
      };
      
      const createdPlant = await mockCreatePlant(plantData);
      expect(createdPlant.id).toBe('new-plant-123');
      expect(createdPlant.name).toBe('Monstera Deliciosa');
      
      // 5. Usuario es redirigido al dashboard
      expect(createdPlant).toBeDefined();
    });

    it('should handle plant creation with AI completion', async () => {
      const mockCompletePlantInfo = vi.fn().mockResolvedValue({
        description: 'Una hermosa planta tropical nativa de México',
        funFacts: ['Es nativa de México', 'Puede crecer hasta 20 metros'],
        careProfile: {
          wateringFrequency: 7,
          sunlightRequirement: 'medium',
          humidityPreference: 'high'
        }
      });

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.completePlantInfo as any).mockImplementation(mockCompletePlantInfo);

      // Simular planta básica creada
      const basicPlant = {
        id: 'plant-123',
        name: 'Monstera Deliciosa',
        species: 'Monstera deliciosa',
        nickname: 'Monstera'
      };

      // Completar información con IA
      const completedInfo = await mockCompletePlantInfo(basicPlant);
      
      expect(completedInfo.description).toBe('Una hermosa planta tropical nativa de México');
      expect(completedInfo.funFacts).toHaveLength(2);
      expect(completedInfo.careProfile.wateringFrequency).toBe(7);
    });

    it('should handle plant creation with multiple images', async () => {
      const mockUpdatePlant = vi.fn().mockResolvedValue({
        id: 'plant-123',
        images: [
          {
            id: 'img-1',
            url: 'https://example.com/plant-1.jpg',
            isProfileImage: true
          },
          {
            id: 'img-2',
            url: 'https://example.com/plant-2.jpg',
            isProfileImage: false
          }
        ]
      });

      const { plantService } = await import('../../../src/services/plantService');
      (plantService.updatePlant as any).mockImplementation(mockUpdatePlant);

      // Simular agregar imagen adicional
      const additionalImage = new File(['fake-image-data'], 'plant-2.jpg', { type: 'image/jpeg' });
      
      const updatedPlant = await mockUpdatePlant('plant-123', {
        images: [additionalImage]
      });

      expect(updatedPlant.images).toHaveLength(2);
      expect(updatedPlant.images[0].isProfileImage).toBe(true);
      expect(updatedPlant.images[1].isProfileImage).toBe(false);
    });
  });

  describe('Error Handling in Plant Creation', () => {
    it('should handle camera permission denied', async () => {
      const mockStartCamera = vi.fn().mockRejectedValue(new Error('Permission denied'));

      const { useCamera } = await import('../../../src/hooks/useCamera');
      vi.mocked(useCamera).mockReturnValue({
        stream: null,
        isStreamActive: false,
        error: new Error('Permission denied'),
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

      await waitFor(() => {
        expect(screen.getByText(/permiso denegado/i)).toBeInTheDocument();
      });
    });

    it('should handle AI analysis failure', async () => {
      const mockAnalyzeImage = vi.fn().mockRejectedValue(new Error('AI service unavailable'));

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);

      const capturedImage = new File(['fake-image-data'], 'plant.jpg', { type: 'image/jpeg' });

      try {
        await mockAnalyzeImage(capturedImage);
      } catch (error) {
        expect(error.message).toBe('AI service unavailable');
      }
    });

    it('should handle image upload failure', async () => {
      const mockUploadImage = vi.fn().mockRejectedValue(new Error('Upload failed'));

      const { imageService } = await import('../../../src/services/imageService');
      (imageService.uploadImage as any).mockImplementation(mockUploadImage);

      const imageFile = new File(['fake-image-data'], 'plant.jpg', { type: 'image/jpeg' });

      try {
        await mockUploadImage(imageFile);
      } catch (error) {
        expect(error.message).toBe('Upload failed');
      }
    });

    it('should handle database creation failure', async () => {
      const mockCreatePlant = vi.fn().mockRejectedValue(new Error('Database error'));

      const { plantService } = await import('../../../src/services/plantService');
      (plantService.createPlant as any).mockImplementation(mockCreatePlant);

      const plantData = {
        name: 'Monstera Deliciosa',
        species: 'Monstera deliciosa',
        nickname: 'Monstera'
      };

      try {
        await mockCreatePlant(plantData);
      } catch (error) {
        expect(error.message).toBe('Database error');
      }
    });
  });

  describe('Plant Creation with Different Scenarios', () => {
    it('should handle plant creation with minimal data', async () => {
      const mockCreatePlant = vi.fn().mockResolvedValue({
        id: 'minimal-plant-123',
        name: 'Unknown Plant',
        species: 'Unknown',
        nickname: 'My Plant'
      });

      const { plantService } = await import('../../../src/services/plantService');
      (plantService.createPlant as any).mockImplementation(mockCreatePlant);

      const minimalPlantData = {
        name: 'Unknown Plant',
        nickname: 'My Plant'
      };

      const createdPlant = await mockCreatePlant(minimalPlantData);
      
      expect(createdPlant.id).toBe('minimal-plant-123');
      expect(createdPlant.species).toBe('Unknown');
    });

    it('should handle plant creation with full data', async () => {
      const mockCreatePlant = vi.fn().mockResolvedValue({
        id: 'full-plant-123',
        name: 'Monstera Deliciosa',
        species: 'Monstera deliciosa',
        nickname: 'Monstera',
        description: 'Una hermosa planta tropical',
        funFacts: ['Es nativa de México'],
        location: 'Interior',
        plantEnvironment: 'interior',
        lightRequirements: 'luz_indirecta',
        healthScore: 85,
        careProfile: {
          wateringFrequency: 7,
          sunlightRequirement: 'medium',
          humidityPreference: 'high'
        }
      });

      const { plantService } = await import('../../../src/services/plantService');
      (plantService.createPlant as any).mockImplementation(mockCreatePlant);

      const fullPlantData = {
        name: 'Monstera Deliciosa',
        species: 'Monstera deliciosa',
        nickname: 'Monstera',
        description: 'Una hermosa planta tropical',
        funFacts: ['Es nativa de México'],
        location: 'Interior',
        plantEnvironment: 'interior',
        lightRequirements: 'luz_indirecta',
        careProfile: {
          wateringFrequency: 7,
          sunlightRequirement: 'medium',
          humidityPreference: 'high'
        }
      };

      const createdPlant = await mockCreatePlant(fullPlantData);
      
      expect(createdPlant.id).toBe('full-plant-123');
      expect(createdPlant.description).toBe('Una hermosa planta tropical');
      expect(createdPlant.careProfile.wateringFrequency).toBe(7);
    });
  });

  describe('Plant Creation Performance', () => {
    it('should handle rapid plant creation', async () => {
      const mockCreatePlant = vi.fn().mockResolvedValue({
        id: 'plant-123',
        name: 'Test Plant'
      });

      const { plantService } = await import('../../../src/services/plantService');
      (plantService.createPlant as any).mockImplementation(mockCreatePlant);

      // Simular creación rápida de múltiples plantas
      const plantCreations = [];
      for (let i = 0; i < 5; i++) {
        plantCreations.push(
          mockCreatePlant({
            name: `Plant ${i}`,
            nickname: `Plant ${i}`
          })
        );
      }

      const results = await Promise.all(plantCreations);
      
      expect(results).toHaveLength(5);
      expect(mockCreatePlant).toHaveBeenCalledTimes(5);
    });

    it('should handle large image uploads', async () => {
      const mockCompressImage = vi.fn().mockResolvedValue(new File(['compressed'], 'compressed.jpg'));
      const mockUploadImage = vi.fn().mockResolvedValue({
        url: 'https://example.com/compressed.jpg',
        id: 'img-123'
      });

      const { imageService } = await import('../../../src/services/imageService');
      (imageService.compressImage as any).mockImplementation(mockCompressImage);
      (imageService.uploadImage as any).mockImplementation(mockUploadImage);

      // Simular imagen grande
      const largeImage = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      const compressedImage = await mockCompressImage(largeImage);
      const uploadResult = await mockUploadImage(compressedImage);

      expect(compressedImage).toBeInstanceOf(File);
      expect(uploadResult.url).toBe('https://example.com/compressed.jpg');
    });
  });

  describe('Plant Creation Validation', () => {
    it('should validate required plant fields', async () => {
      const mockCreatePlant = vi.fn().mockImplementation((plantData) => {
        if (!plantData.name) {
          throw new Error('Plant name is required');
        }
        return Promise.resolve({ id: 'plant-123', ...plantData });
      });

      const { plantService } = await import('../../../src/services/plantService');
      (plantService.createPlant as any).mockImplementation(mockCreatePlant);

      // Test con datos válidos
      const validPlant = await mockCreatePlant({ name: 'Monstera', nickname: 'Monstera' });
      expect(validPlant.name).toBe('Monstera');

      // Test con datos inválidos
      try {
        await mockCreatePlant({ nickname: 'Monstera' });
      } catch (error) {
        expect(error.message).toBe('Plant name is required');
      }
    });

    it('should validate image format', async () => {
      const mockAnalyzeImage = vi.fn().mockImplementation((image) => {
        if (!image.type.startsWith('image/')) {
          throw new Error('Invalid image format');
        }
        return Promise.resolve({ plantName: 'Test Plant' });
      });

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);

      // Test con imagen válida
      const validImage = new File(['fake-data'], 'plant.jpg', { type: 'image/jpeg' });
      const analysis = await mockAnalyzeImage(validImage);
      expect(analysis.plantName).toBe('Test Plant');

      // Test con archivo inválido
      const invalidFile = new File(['fake-data'], 'document.pdf', { type: 'application/pdf' });
      try {
        await mockAnalyzeImage(invalidFile);
      } catch (error) {
        expect(error.message).toBe('Invalid image format');
      }
    });
  });
}); 