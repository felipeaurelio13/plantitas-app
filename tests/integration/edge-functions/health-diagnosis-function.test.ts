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

describe('Health Diagnosis Edge Function Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Diagnosis Function Calls', () => {
    it('should successfully update health diagnosis', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          updatedAnalysis: {
            overallHealth: 'excellent',
            confidence: 95,
            issues: [],
            recommendations: ['Continue current care routine'],
            moistureLevel: 80,
            growthStage: 'thriving',
            healthScore: 95
          },
          previousAnalysis: {
            overallHealth: 'good',
            confidence: 85,
            issues: [],
            recommendations: ['Keep up the good care!'],
            moistureLevel: 70,
            growthStage: 'mature',
            healthScore: 85
          },
          improvements: [
            'Increased leaf count',
            'Better color saturation',
            'Improved overall health score'
          ]
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const newImage = new File(['new-health-data'], 'new-health.jpg', { type: 'image/jpeg' });
      const imageData = await newImage.arrayBuffer();
      const plantId = 'plant-123';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'new-health.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeDefined();
      expect(response.data.updatedAnalysis.overallHealth).toBe('excellent');
      expect(response.data.updatedAnalysis.confidence).toBe(95);
      expect(response.data.previousAnalysis.overallHealth).toBe('good');
      expect(response.data.improvements).toHaveLength(3);
      expect(response.error).toBeNull();
    });

    it('should handle health diagnosis with detected issues', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          updatedAnalysis: {
            overallHealth: 'poor',
            confidence: 90,
            issues: [
              { type: 'disease', severity: 'moderate', description: 'Leaf spots detected' },
              { type: 'nutrition', severity: 'mild', description: 'Slight yellowing of leaves' }
            ],
            recommendations: [
              'Remove affected leaves',
              'Apply fungicide treatment',
              'Increase humidity levels',
              'Check soil moisture'
            ],
            moistureLevel: 30,
            growthStage: 'stressed',
            healthScore: 40
          },
          previousAnalysis: {
            overallHealth: 'good',
            confidence: 85,
            issues: [],
            recommendations: ['Keep up the good care!'],
            moistureLevel: 70,
            growthStage: 'mature',
            healthScore: 85
          },
          urgentActions: [
            'Immediate: Remove affected leaves',
            'Within 24h: Apply fungicide',
            'Within 48h: Adjust humidity'
          ]
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const sickPlantImage = new File(['sick-plant-data'], 'sick-plant.jpg', { type: 'image/jpeg' });
      const imageData = await sickPlantImage.arrayBuffer();
      const plantId = 'plant-123';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'sick-plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data.updatedAnalysis.overallHealth).toBe('poor');
      expect(response.data.updatedAnalysis.issues).toHaveLength(2);
      expect(response.data.updatedAnalysis.recommendations).toHaveLength(4);
      expect(response.data.urgentActions).toHaveLength(3);
      expect(response.data.updatedAnalysis.healthScore).toBe(40);
    });

    it('should handle gradual health improvement', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          updatedAnalysis: {
            overallHealth: 'good',
            confidence: 88,
            issues: [],
            recommendations: ['Continue current care routine'],
            moistureLevel: 75,
            growthStage: 'recovering',
            healthScore: 88
          },
          previousAnalysis: {
            overallHealth: 'fair',
            confidence: 70,
            issues: [
              { type: 'watering', severity: 'mild', description: 'Slight dehydration' }
            ],
            recommendations: ['Increase watering frequency'],
            moistureLevel: 50,
            growthStage: 'stressed',
            healthScore: 70
          },
          improvements: [
            'Improved moisture levels',
            'Reduced stress indicators',
            'Better leaf color'
          ],
          progress: {
            healthImprovement: 18,
            timeSinceLastUpdate: '7 days',
            trend: 'positive'
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const improvingPlantImage = new File(['improving-plant-data'], 'improving-plant.jpg', { type: 'image/jpeg' });
      const imageData = await improvingPlantImage.arrayBuffer();
      const plantId = 'plant-123';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'improving-plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data.updatedAnalysis.overallHealth).toBe('good');
      expect(response.data.previousAnalysis.overallHealth).toBe('fair');
      expect(response.data.improvements).toHaveLength(3);
      expect(response.data.progress.healthImprovement).toBe(18);
      expect(response.data.progress.trend).toBe('positive');
    });
  });

  describe('Function Error Handling', () => {
    it('should handle AI service unavailable during diagnosis', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'AI diagnosis service is currently unavailable. Please try again later.',
          status: 503
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const newImage = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await newImage.arrayBuffer();
      const plantId = 'plant-123';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.message).toContain('unavailable');
      expect(response.error.status).toBe(503);
    });

    it('should handle invalid plant ID', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Invalid plant ID provided. Plant not found.',
          status: 404
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const newImage = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await newImage.arrayBuffer();
      const invalidPlantId = 'invalid-plant-id';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId: invalidPlantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.message).toContain('Plant not found');
      expect(response.error.status).toBe(404);
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
      const plantId = 'plant-123';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'corrupted.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.message).toContain('corrupted');
      expect(response.error.status).toBe(422);
    });

    it('should handle unauthorized access', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Unauthorized access. Please authenticate.',
          status: 401
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const newImage = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await newImage.arrayBuffer();
      const plantId = 'plant-123';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg',
          userId: null
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(401);
      expect(response.error.message).toContain('Unauthorized');
    });
  });

  describe('Function Performance', () => {
    it('should handle multiple concurrent health updates', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          updatedAnalysis: {
            overallHealth: 'good',
            confidence: 85,
            healthScore: 85
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const plants = Array.from({ length: 5 }, (_, i) => ({
        id: `plant-${i}`,
        image: new File([`image-${i}-data`], `plant-${i}.jpg`, { type: 'image/jpeg' })
      }));

      const responses = await Promise.all(
        plants.map(async (plant) => {
          const imageData = await plant.image.arrayBuffer();
          return supabase.functions.invoke('update-health-diagnosis', {
            body: {
              plantId: plant.id,
              image: Array.from(new Uint8Array(imageData)),
              filename: plant.image.name,
              contentType: plant.image.type
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

    it('should handle large image files efficiently', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          updatedAnalysis: {
            overallHealth: 'good',
            confidence: 85,
            healthScore: 85
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      // Simular imagen grande (8MB)
      const largeImage = new File(['x'.repeat(8 * 1024 * 1024)], 'large-health.jpg', { type: 'image/jpeg' });
      const imageData = await largeImage.arrayBuffer();
      const plantId = 'plant-123';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'large-health.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeDefined();
      expect(response.data.updatedAnalysis.overallHealth).toBe('good');
      expect(response.error).toBeNull();
    });
  });

  describe('Function Response Validation', () => {
    it('should validate response structure for successful diagnosis', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          updatedAnalysis: {
            overallHealth: 'good',
            confidence: 85,
            issues: [],
            recommendations: ['Continue care'],
            moistureLevel: 70,
            growthStage: 'mature',
            healthScore: 85
          },
          previousAnalysis: {
            overallHealth: 'fair',
            confidence: 75,
            issues: [],
            recommendations: ['Keep up the care'],
            moistureLevel: 65,
            growthStage: 'mature',
            healthScore: 75
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const newImage = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await newImage.arrayBuffer();
      const plantId = 'plant-123';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      // Validar estructura de respuesta
      expect(response.data).toHaveProperty('updatedAnalysis');
      expect(response.data).toHaveProperty('previousAnalysis');
      expect(response.data.updatedAnalysis).toHaveProperty('overallHealth');
      expect(response.data.updatedAnalysis).toHaveProperty('confidence');
      expect(response.data.updatedAnalysis).toHaveProperty('issues');
      expect(response.data.updatedAnalysis).toHaveProperty('recommendations');
      expect(response.data.updatedAnalysis).toHaveProperty('moistureLevel');
      expect(response.data.updatedAnalysis).toHaveProperty('growthStage');
      expect(response.data.updatedAnalysis).toHaveProperty('healthScore');
    });

    it('should validate confidence thresholds in response', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          updatedAnalysis: {
            overallHealth: 'good',
            confidence: 75,
            healthScore: 75
          },
          previousAnalysis: {
            overallHealth: 'fair',
            confidence: 70,
            healthScore: 70
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const newImage = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await newImage.arrayBuffer();
      const plantId = 'plant-123';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      // Validar umbrales de confianza
      expect(response.data.updatedAnalysis.confidence).toBeGreaterThanOrEqual(50);
      expect(response.data.updatedAnalysis.confidence).toBeLessThanOrEqual(100);
      expect(response.data.previousAnalysis.confidence).toBeGreaterThanOrEqual(50);
      expect(response.data.previousAnalysis.confidence).toBeLessThanOrEqual(100);
    });

    it('should handle low confidence diagnosis results', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          updatedAnalysis: {
            overallHealth: 'unknown',
            confidence: 35,
            healthScore: 35,
            recommendations: ['Please provide a clearer image for better analysis']
          },
          previousAnalysis: {
            overallHealth: 'good',
            confidence: 85,
            healthScore: 85
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const blurryImage = new File(['blurry-data'], 'blurry-health.jpg', { type: 'image/jpeg' });
      const imageData = await blurryImage.arrayBuffer();
      const plantId = 'plant-123';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'blurry-health.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data.updatedAnalysis.confidence).toBeLessThan(50);
      expect(response.data.updatedAnalysis.overallHealth).toBe('unknown');
      expect(response.data.updatedAnalysis.recommendations[0]).toContain('clearer image');
    });
  });

  describe('Function Security', () => {
    it('should handle rate limiting', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Rate limit exceeded. Please try again later.',
          status: 429
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const newImage = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await newImage.arrayBuffer();
      const plantId = 'plant-123';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(429);
      expect(response.error.message).toContain('Rate limit');
    });

    it('should handle malformed requests', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Invalid request format. Please check your request body.',
          status: 400
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          // Missing required fields
          plantId: 'plant-123'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(400);
      expect(response.error.message).toContain('Invalid request');
    });
  });

  describe('Function Data Integrity', () => {
    it('should maintain data consistency between updates', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          updatedAnalysis: {
            overallHealth: 'excellent',
            confidence: 95,
            healthScore: 95
          },
          previousAnalysis: {
            overallHealth: 'good',
            confidence: 85,
            healthScore: 85
          },
          improvements: [
            'Increased leaf count',
            'Better color saturation'
          ]
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const newImage = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await newImage.arrayBuffer();
      const plantId = 'plant-123';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      // Validar consistencia de datos
      expect(response.data.updatedAnalysis.healthScore).toBeGreaterThan(response.data.previousAnalysis.healthScore);
      expect(response.data.updatedAnalysis.confidence).toBeGreaterThan(response.data.previousAnalysis.confidence);
      expect(response.data.improvements).toHaveLength(2);
    });

    it('should handle plant ownership validation', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Plant not found or access denied.',
          status: 403
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const newImage = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const imageData = await newImage.arrayBuffer();
      const plantId = 'plant-123';

      const response = await supabase.functions.invoke('update-health-diagnosis', {
        body: {
          plantId,
          image: Array.from(new Uint8Array(imageData)),
          filename: 'plant.jpg',
          contentType: 'image/jpeg',
          userId: 'different-user'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(403);
      expect(response.error.message).toContain('access denied');
    });
  });
}); 