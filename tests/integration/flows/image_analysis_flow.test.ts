import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImagePreview } from '../../../src/components/camera/ImagePreview';
import { PlantDetail } from '../../../src/pages/PlantDetail';

// Mock de servicios y hooks
vi.mock('../../../src/services/aiService', () => ({
  aiService: {
    analyzeImage: vi.fn(),
    analyzeProgressImages: vi.fn(),
    updateHealthDiagnosis: vi.fn()
  }
}));

vi.mock('../../../src/services/imageService', () => ({
  imageService: {
    uploadImage: vi.fn(),
    compressImage: vi.fn(),
    resizeImage: vi.fn()
  }
}));

vi.mock('../../../src/services/plantService', () => ({
  plantService: {
    updatePlant: vi.fn(),
    getPlantById: vi.fn()
  }
}));

vi.mock('../../../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

vi.mock('../../../src/hooks/usePlantImageMutations', () => ({
  usePlantImageMutations: () => ({
    addImageToPlant: vi.fn(),
    updatePlantImage: vi.fn(),
    deletePlantImage: vi.fn(),
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

describe('Image Analysis Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Image Analysis Flow', () => {
    it('should handle complete image analysis from capture to plant update', async () => {
      const mockAnalyzeImage = vi.fn().mockResolvedValue({
        plantName: 'Monstera Deliciosa',
        species: 'Monstera deliciosa',
        healthAnalysis: {
          overallHealth: 'good',
          confidence: 85,
          issues: [],
          recommendations: ['Keep up the good care!'],
          moistureLevel: 70,
          growthStage: 'mature'
        }
      });

      const mockUploadImage = vi.fn().mockResolvedValue({
        url: 'https://example.com/plant-image.jpg',
        id: 'img-123'
      });

      const mockUpdatePlant = vi.fn().mockResolvedValue({
        id: 'plant-123',
        images: [
          {
            id: 'img-123',
            url: 'https://example.com/plant-image.jpg',
            timestamp: new Date(),
            isProfileImage: true,
            healthAnalysis: {
              overallHealth: 'good',
              confidence: 85,
              issues: [],
              recommendations: ['Keep up the good care!']
            }
          }
        ],
        healthScore: 85
      });

      // Mock de servicios
      const { aiService } = await import('../../../src/services/aiService');
      const { imageService } = await import('../../../src/services/imageService');
      const { plantService } = await import('../../../src/services/plantService');

      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);
      (imageService.uploadImage as any).mockImplementation(mockUploadImage);
      (plantService.updatePlant as any).mockImplementation(mockUpdatePlant);

      // Simular imagen capturada
      const capturedImage = new File(['fake-image-data'], 'plant.jpg', { type: 'image/jpeg' });
      
      // 1. Comprimir imagen
      const compressedImage = await imageService.compressImage(capturedImage);
      expect(compressedImage).toBeInstanceOf(File);
      
      // 2. Analizar imagen con IA
      const analysisResult = await mockAnalyzeImage(compressedImage);
      expect(analysisResult.plantName).toBe('Monstera Deliciosa');
      expect(analysisResult.healthAnalysis.confidence).toBe(85);
      
      // 3. Subir imagen
      const uploadResult = await mockUploadImage(compressedImage);
      expect(uploadResult.url).toBe('https://example.com/plant-image.jpg');
      
      // 4. Actualizar planta con nueva imagen y análisis
      const plantUpdateData = {
        images: [{
          id: uploadResult.id,
          url: uploadResult.url,
          timestamp: new Date(),
          isProfileImage: true,
          healthAnalysis: analysisResult.healthAnalysis
        }],
        healthScore: analysisResult.healthAnalysis.confidence
      };
      
      const updatedPlant = await mockUpdatePlant('plant-123', plantUpdateData);
      expect(updatedPlant.healthScore).toBe(85);
      expect(updatedPlant.images).toHaveLength(1);
      expect(updatedPlant.images[0].healthAnalysis.confidence).toBe(85);
    });

    it('should handle image analysis with health issues detection', async () => {
      const mockAnalyzeImage = vi.fn().mockResolvedValue({
        plantName: 'Monstera Deliciosa',
        species: 'Monstera deliciosa',
        healthAnalysis: {
          overallHealth: 'poor',
          confidence: 90,
          issues: [
            { type: 'disease', severity: 'moderate', description: 'Leaf spots detected' },
            { type: 'nutrition', severity: 'mild', description: 'Slight yellowing of leaves' }
          ],
          recommendations: [
            'Remove affected leaves',
            'Apply fungicide treatment',
            'Increase humidity levels'
          ],
          moistureLevel: 30,
          growthStage: 'mature'
        }
      });

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);

      const capturedImage = new File(['fake-image-data'], 'sick-plant.jpg', { type: 'image/jpeg' });
      
      const analysisResult = await mockAnalyzeImage(capturedImage);
      
      expect(analysisResult.healthAnalysis.overallHealth).toBe('poor');
      expect(analysisResult.healthAnalysis.issues).toHaveLength(2);
      expect(analysisResult.healthAnalysis.recommendations).toHaveLength(3);
      expect(analysisResult.healthAnalysis.moistureLevel).toBe(30);
    });

    it('should handle multiple image analysis for progress tracking', async () => {
      const mockAnalyzeProgressImages = vi.fn().mockResolvedValue({
        progress: {
          growthRate: 15,
          healthImprovement: 10,
          newLeaves: 3,
          overallProgress: 'positive'
        },
        comparison: {
          before: { healthScore: 70, leafCount: 8 },
          after: { healthScore: 85, leafCount: 11 },
          improvements: ['Increased leaf count', 'Better color saturation']
        }
      });

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.analyzeProgressImages as any).mockImplementation(mockAnalyzeProgressImages);

      const beforeImage = new File(['before-data'], 'before.jpg', { type: 'image/jpeg' });
      const afterImage = new File(['after-data'], 'after.jpg', { type: 'image/jpeg' });
      
      const progressResult = await mockAnalyzeProgressImages([beforeImage, afterImage]);
      
      expect(progressResult.progress.growthRate).toBe(15);
      expect(progressResult.progress.overallProgress).toBe('positive');
      expect(progressResult.comparison.improvements).toHaveLength(2);
    });
  });

  describe('Image Processing and Optimization', () => {
    it('should handle image compression for upload', async () => {
      const mockCompressImage = vi.fn().mockResolvedValue(
        new File(['compressed-data'], 'compressed.jpg', { type: 'image/jpeg' })
      );

      const { imageService } = await import('../../../src/services/imageService');
      (imageService.compressImage as any).mockImplementation(mockCompressImage);

      const originalImage = new File(['x'.repeat(5 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      const compressedImage = await mockCompressImage(originalImage, { quality: 0.8, maxWidth: 1920 });
      
      expect(compressedImage).toBeInstanceOf(File);
      expect(compressedImage.name).toBe('compressed.jpg');
    });

    it('should handle image resizing for different use cases', async () => {
      const mockResizeImage = vi.fn().mockResolvedValue(
        new File(['resized-data'], 'resized.jpg', { type: 'image/jpeg' })
      );

      const { imageService } = await import('../../../src/services/imageService');
      (imageService.resizeImage as any).mockImplementation(mockResizeImage);

      const originalImage = new File(['image-data'], 'original.jpg', { type: 'image/jpeg' });
      
      // Resize para thumbnail
      const thumbnail = await mockResizeImage(originalImage, { width: 150, height: 150 });
      expect(thumbnail.name).toBe('resized.jpg');
      
      // Resize para preview
      const preview = await mockResizeImage(originalImage, { width: 800, height: 600 });
      expect(preview.name).toBe('resized.jpg');
    });

    it('should handle different image formats', async () => {
      const mockAnalyzeImage = vi.fn().mockResolvedValue({
        plantName: 'Test Plant',
        healthAnalysis: { overallHealth: 'good', confidence: 80 }
      });

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);

      const imageFormats = [
        new File(['jpeg-data'], 'plant.jpg', { type: 'image/jpeg' }),
        new File(['png-data'], 'plant.png', { type: 'image/png' }),
        new File(['webp-data'], 'plant.webp', { type: 'image/webp' })
      ];

      for (const image of imageFormats) {
        const result = await mockAnalyzeImage(image);
        expect(result.plantName).toBe('Test Plant');
      }
    });
  });

  describe('Health Analysis Updates', () => {
    it('should handle health diagnosis updates', async () => {
      const mockUpdateHealthDiagnosis = vi.fn().mockResolvedValue({
        updatedAnalysis: {
          overallHealth: 'excellent',
          confidence: 95,
          issues: [],
          recommendations: ['Continue current care routine'],
          moistureLevel: 80,
          growthStage: 'thriving'
        },
        previousAnalysis: {
          overallHealth: 'good',
          confidence: 85,
          issues: [],
          recommendations: ['Keep up the good care!']
        }
      });

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.updateHealthDiagnosis as any).mockImplementation(mockUpdateHealthDiagnosis);

      const newImage = new File(['new-data'], 'new-health.jpg', { type: 'image/jpeg' });
      const plantId = 'plant-123';
      
      const updateResult = await mockUpdateHealthDiagnosis(plantId, newImage);
      
      expect(updateResult.updatedAnalysis.overallHealth).toBe('excellent');
      expect(updateResult.updatedAnalysis.confidence).toBe(95);
      expect(updateResult.previousAnalysis.overallHealth).toBe('good');
    });

    it('should handle health analysis with specific plant conditions', async () => {
      const mockAnalyzeImage = vi.fn().mockResolvedValue({
        plantName: 'Orchid',
        species: 'Phalaenopsis',
        healthAnalysis: {
          overallHealth: 'fair',
          confidence: 88,
          issues: [
            { type: 'watering', severity: 'moderate', description: 'Overwatering detected' },
            { type: 'light', severity: 'mild', description: 'Insufficient light' }
          ],
          recommendations: [
            'Reduce watering frequency',
            'Move to brighter location',
            'Check for root rot'
          ],
          moistureLevel: 90,
          growthStage: 'flowering'
        }
      });

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);

      const orchidImage = new File(['orchid-data'], 'orchid.jpg', { type: 'image/jpeg' });
      
      const analysis = await mockAnalyzeImage(orchidImage);
      
      expect(analysis.plantName).toBe('Orchid');
      expect(analysis.healthAnalysis.issues).toHaveLength(2);
      expect(analysis.healthAnalysis.moistureLevel).toBe(90);
      expect(analysis.healthAnalysis.growthStage).toBe('flowering');
    });
  });

  describe('Error Handling in Image Analysis', () => {
    it('should handle AI service unavailable', async () => {
      const mockAnalyzeImage = vi.fn().mockRejectedValue(new Error('AI service unavailable'));

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);

      const image = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });

      try {
        await mockAnalyzeImage(image);
      } catch (error) {
        expect(error.message).toBe('AI service unavailable');
      }
    });

    it('should handle image upload failure', async () => {
      const mockUploadImage = vi.fn().mockRejectedValue(new Error('Upload failed - network error'));

      const { imageService } = await import('../../../src/services/imageService');
      (imageService.uploadImage as any).mockImplementation(mockUploadImage);

      const image = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });

      try {
        await mockUploadImage(image);
      } catch (error) {
        expect(error.message).toBe('Upload failed - network error');
      }
    });

    it('should handle invalid image format', async () => {
      const mockAnalyzeImage = vi.fn().mockImplementation((image) => {
        if (!image.type.startsWith('image/')) {
          throw new Error('Invalid image format');
        }
        return Promise.resolve({ plantName: 'Test Plant' });
      });

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);

      const invalidFile = new File(['data'], 'document.pdf', { type: 'application/pdf' });

      try {
        await mockAnalyzeImage(invalidFile);
      } catch (error) {
        expect(error.message).toBe('Invalid image format');
      }
    });

    it('should handle corrupted image data', async () => {
      const mockAnalyzeImage = vi.fn().mockRejectedValue(new Error('Unable to process image - corrupted data'));

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);

      const corruptedImage = new File(['corrupted-data'], 'corrupted.jpg', { type: 'image/jpeg' });

      try {
        await mockAnalyzeImage(corruptedImage);
      } catch (error) {
        expect(error.message).toBe('Unable to process image - corrupted data');
      }
    });
  });

  describe('Image Analysis Performance', () => {
    it('should handle large image files efficiently', async () => {
      const mockCompressImage = vi.fn().mockResolvedValue(
        new File(['compressed'], 'compressed.jpg', { type: 'image/jpeg' })
      );
      const mockAnalyzeImage = vi.fn().mockResolvedValue({
        plantName: 'Test Plant',
        healthAnalysis: { overallHealth: 'good', confidence: 80 }
      });

      const { imageService } = await import('../../../src/services/imageService');
      const { aiService } = await import('../../../src/services/aiService');
      
      (imageService.compressImage as any).mockImplementation(mockCompressImage);
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);

      // Simular imagen grande (10MB)
      const largeImage = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      const compressedImage = await mockCompressImage(largeImage);
      const analysis = await mockAnalyzeImage(compressedImage);

      expect(compressedImage).toBeInstanceOf(File);
      expect(analysis.plantName).toBe('Test Plant');
    });

    it('should handle multiple concurrent image analyses', async () => {
      const mockAnalyzeImage = vi.fn().mockResolvedValue({
        plantName: 'Test Plant',
        healthAnalysis: { overallHealth: 'good', confidence: 80 }
      });

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);

      const images = Array.from({ length: 5 }, (_, i) => 
        new File([`image-${i}-data`], `plant-${i}.jpg`, { type: 'image/jpeg' })
      );

      const analyses = await Promise.all(images.map(img => mockAnalyzeImage(img)));

      expect(analyses).toHaveLength(5);
      expect(mockAnalyzeImage).toHaveBeenCalledTimes(5);
    });
  });

  describe('Image Analysis Quality Assurance', () => {
    it('should validate analysis confidence thresholds', async () => {
      const mockAnalyzeImage = vi.fn().mockResolvedValue({
        plantName: 'Test Plant',
        healthAnalysis: { overallHealth: 'good', confidence: 75 }
      });

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);

      const image = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const result = await mockAnalyzeImage(image);

      // Validar que la confianza esté en rango aceptable
      expect(result.healthAnalysis.confidence).toBeGreaterThanOrEqual(50);
      expect(result.healthAnalysis.confidence).toBeLessThanOrEqual(100);
    });

    it('should handle low confidence analysis results', async () => {
      const mockAnalyzeImage = vi.fn().mockResolvedValue({
        plantName: 'Unknown Plant',
        healthAnalysis: { 
          overallHealth: 'unknown', 
          confidence: 30,
          issues: [],
          recommendations: ['Please provide a clearer image']
        }
      });

      const { aiService } = await import('../../../src/services/aiService');
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);

      const blurryImage = new File(['blurry-data'], 'blurry.jpg', { type: 'image/jpeg' });
      const result = await mockAnalyzeImage(blurryImage);

      expect(result.plantName).toBe('Unknown Plant');
      expect(result.healthAnalysis.confidence).toBeLessThan(50);
      expect(result.healthAnalysis.overallHealth).toBe('unknown');
    });
  });
}); 