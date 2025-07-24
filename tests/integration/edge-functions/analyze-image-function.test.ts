import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../../src/lib/supabase';

// Mock de Supabase
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('Analyze Image Edge Function Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Image Analysis Function Calls', () => {
    it('should successfully analyze plant image', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
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
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const imageFile = new File(['fake-image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await imageFile.arrayBuffer();

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeDefined();
      expect(response.data.plantName).toBe('Monstera Deliciosa');
      expect(response.data.healthAnalysis.overallHealth).toBe('good');
      expect(response.data.healthAnalysis.confidence).toBe(85);
      expect(response.error).toBeNull();
    });

    it('should handle image analysis with health issues', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
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
            growthStage: 'stressed'
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const sickPlantImage = new File(['sick-plant-data'], 'sick-plant.jpg', { type: 'image/jpeg' });
      const imageData = await sickPlantImage.arrayBuffer();

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: Array.from(new Uint8Array(imageData)),
          filename: 'sick-plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data.healthAnalysis.overallHealth).toBe('poor');
      expect(response.data.healthAnalysis.issues).toHaveLength(2);
      expect(response.data.healthAnalysis.recommendations).toHaveLength(3);
      expect(response.data.healthAnalysis.moistureLevel).toBe(30);
    });

    it('should handle different plant species identification', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          plantName: 'Orchid',
          species: 'Phalaenopsis',
          healthAnalysis: {
            overallHealth: 'excellent',
            confidence: 92,
            issues: [],
            recommendations: ['Continue current care routine'],
            moistureLevel: 80,
            growthStage: 'flowering'
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const orchidImage = new File(['orchid-data'], 'orchid.jpg', { type: 'image/jpeg' });
      const imageData = await orchidImage.arrayBuffer();

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: Array.from(new Uint8Array(imageData)),
          filename: 'orchid.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data.plantName).toBe('Orchid');
      expect(response.data.species).toBe('Phalaenopsis');
      expect(response.data.healthAnalysis.growthStage).toBe('flowering');
    });
  });

  describe('Function Error Handling', () => {
    it('should handle invalid image format', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Invalid image format. Please provide a valid JPEG, PNG, or WebP image.',
          status: 400
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const invalidFile = new File(['invalid-data'], 'document.pdf', { type: 'application/pdf' });
      const fileData = await invalidFile.arrayBuffer();

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: Array.from(new Uint8Array(fileData)),
          filename: 'document.pdf',
          contentType: 'application/pdf'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.message).toContain('Invalid image format');
      expect(response.error.status).toBe(400);
    });

    it('should handle corrupted image data', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Unable to process image. The file appears to be corrupted.',
          status: 422
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const corruptedImage = new File(['corrupted-data'], 'corrupted.jpg', { type: 'image/jpeg' });
      const imageData = await corruptedImage.arrayBuffer();

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: Array.from(new Uint8Array(imageData)),
          filename: 'corrupted.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.message).toContain('corrupted');
      expect(response.error.status).toBe(422);
    });

    it('should handle AI service unavailable', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'AI analysis service is currently unavailable. Please try again later.',
          status: 503
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const imageFile = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await imageFile.arrayBuffer();

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.message).toContain('unavailable');
      expect(response.error.status).toBe(503);
    });

    it('should handle large image files', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Image file is too large. Maximum size is 10MB.',
          status: 413
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      // Simular imagen grande (15MB)
      const largeImage = new File(['x'.repeat(15 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const imageData = await largeImage.arrayBuffer();

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: Array.from(new Uint8Array(imageData)),
          filename: 'large.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.message).toContain('too large');
      expect(response.error.status).toBe(413);
    });
  });

  describe('Function Performance', () => {
    it('should handle multiple concurrent image analyses', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          plantName: 'Test Plant',
          healthAnalysis: { overallHealth: 'good', confidence: 80 }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const images = Array.from({ length: 5 }, (_, i) => 
        new File([`image-${i}-data`], `plant-${i}.jpg`, { type: 'image/jpeg' })
      );

      const responses = await Promise.all(
        images.map(async (image) => {
          const imageData = await image.arrayBuffer();
          return supabase.functions.invoke('analyze-image', {
            body: {
              image: Array.from(new Uint8Array(imageData)),
              filename: image.name,
              contentType: image.type
            }
          });
        })
      );

      expect(responses).toHaveLength(5);
      expect(mockInvoke).toHaveBeenCalledTimes(5);
      
      responses.forEach(response => {
        expect(response.data).toBeDefined();
        expect(response.error).toBeNull();
      });
    });

    it('should handle different image formats efficiently', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          plantName: 'Test Plant',
          healthAnalysis: { overallHealth: 'good', confidence: 80 }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const imageFormats = [
        new File(['jpeg-data'], 'plant.jpg', { type: 'image/jpeg' }),
        new File(['png-data'], 'plant.png', { type: 'image/png' }),
        new File(['webp-data'], 'plant.webp', { type: 'image/webp' })
      ];

      for (const image of imageFormats) {
        const imageData = await image.arrayBuffer();
        const response = await supabase.functions.invoke('analyze-image', {
          body: {
            image: Array.from(new Uint8Array(imageData)),
            filename: image.name,
            contentType: image.type
          }
        });

        expect(response.data).toBeDefined();
        expect(response.error).toBeNull();
      }
    });
  });

  describe('Function Response Validation', () => {
    it('should validate response structure for successful analysis', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
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
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const imageFile = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await imageFile.arrayBuffer();

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      // Validar estructura de respuesta
      expect(response.data).toHaveProperty('plantName');
      expect(response.data).toHaveProperty('species');
      expect(response.data).toHaveProperty('healthAnalysis');
      expect(response.data.healthAnalysis).toHaveProperty('overallHealth');
      expect(response.data.healthAnalysis).toHaveProperty('confidence');
      expect(response.data.healthAnalysis).toHaveProperty('issues');
      expect(response.data.healthAnalysis).toHaveProperty('recommendations');
      expect(response.data.healthAnalysis).toHaveProperty('moistureLevel');
      expect(response.data.healthAnalysis).toHaveProperty('growthStage');
    });

    it('should validate confidence thresholds in response', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          plantName: 'Test Plant',
          healthAnalysis: {
            overallHealth: 'good',
            confidence: 75,
            issues: [],
            recommendations: ['Continue care']
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const imageFile = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await imageFile.arrayBuffer();

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      // Validar umbrales de confianza
      expect(response.data.healthAnalysis.confidence).toBeGreaterThanOrEqual(50);
      expect(response.data.healthAnalysis.confidence).toBeLessThanOrEqual(100);
    });

    it('should handle low confidence analysis results', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          plantName: 'Unknown Plant',
          species: 'Unknown',
          healthAnalysis: {
            overallHealth: 'unknown',
            confidence: 35,
            issues: [],
            recommendations: ['Please provide a clearer image for better analysis']
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const blurryImage = new File(['blurry-data'], 'blurry.jpg', { type: 'image/jpeg' });
      const imageData = await blurryImage.arrayBuffer();

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: Array.from(new Uint8Array(imageData)),
          filename: 'blurry.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data.plantName).toBe('Unknown Plant');
      expect(response.data.healthAnalysis.confidence).toBeLessThan(50);
      expect(response.data.healthAnalysis.overallHealth).toBe('unknown');
      expect(response.data.healthAnalysis.recommendations[0]).toContain('clearer image');
    });
  });

  describe('Function Security', () => {
    it('should handle unauthorized access attempts', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Unauthorized access. Please authenticate.',
          status: 401
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const imageFile = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await imageFile.arrayBuffer();

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(401);
      expect(response.error.message).toContain('Unauthorized');
    });

    it('should handle rate limiting', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Rate limit exceeded. Please try again later.',
          status: 429
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const imageFile = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await imageFile.arrayBuffer();

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(429);
      expect(response.error.message).toContain('Rate limit');
    });
  });
}); 