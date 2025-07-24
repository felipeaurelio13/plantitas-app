import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as aiService from '../../../src/services/aiService';
import { Plant, HealthAnalysis } from '../../../src/schemas';

// Mock de Supabase
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    },
    auth: {
      getSession: vi.fn(() => ({
        data: { session: { access_token: 'test-token' } },
        error: null
      }))
    }
  }
}));

const mockPlant: Plant = {
  id: 'test-plant-1',
  name: 'Monstera Deliciosa',
  species: 'Monstera deliciosa',
  nickname: 'Monstera',
  description: 'Una hermosa planta tropical',
  funFacts: ['Es nativa de México'],
  location: 'Interior',
  plantEnvironment: 'interior',
  lightRequirements: 'luz_indirecta',
  dateAdded: new Date('2024-01-01'),
  images: [
    {
      id: 'img-1',
      url: 'https://example.com/monstera.jpg',
      timestamp: new Date('2024-01-01'),
      isProfileImage: true,
      healthAnalysis: {
        overallHealth: 'good',
        confidence: 85,
        issues: [],
        recommendations: ['Keep up the good care!'],
        moistureLevel: 70,
        growthStage: 'mature'
      }
    }
  ],
  healthScore: 85,
  careProfile: {
    wateringFrequency: 7,
    sunlightRequirement: 'medium',
    humidityPreference: 'high',
    temperatureRange: { min: 18, max: 25 },
    fertilizingFrequency: 30,
    soilType: 'Well-draining potting mix'
  },
  personality: {
    traits: ['friendly', 'resilient'],
    communicationStyle: 'cheerful',
    catchphrases: ['¡Hola!', '¡Gracias por cuidarme!'],
    moodFactors: { health: 0.8, care: 0.9, attention: 0.7 }
  },
  chatHistory: [],
  notifications: []
};

describe('aiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeImage', () => {
    it('should analyze image successfully', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      const mockAnalysis: HealthAnalysis = {
        overallHealth: 'good',
        confidence: 85,
        issues: ['slight_overwatering'],
        recommendations: ['Reduce watering frequency'],
        moistureLevel: 70,
        growthStage: 'mature'
      };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: mockAnalysis,
        error: null
      });

      const imageData = 'data:image/jpeg;base64,test-image-data';
      const result = await aiService.analyzeImage(imageData);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('analyze-image', {
        body: { imageDataUrl: imageData },
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      expect(result).toEqual(mockAnalysis);
    });

    it('should handle analysis errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Analysis failed' }
      });

      const imageData = 'data:image/jpeg;base64,test-image-data';

      await expect(aiService.analyzeImage(imageData)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockRejectedValue(new Error('Network error'));

      const imageData = 'data:image/jpeg;base64,test-image-data';

      await expect(aiService.analyzeImage(imageData)).rejects.toThrow('Network error');
    });
  });

  describe('completePlantInfo', () => {
    it('should complete plant information successfully', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          plantEnvironment: 'interior',
          lightRequirements: 'luz_indirecta',
          description: 'Una hermosa planta tropical con hojas características',
          funFacts: ['Es nativa de México', 'Puede crecer hasta 20 metros']
        },
        error: null
      });

      const result = await aiService.completePlantInfo(
        'Monstera deliciosa',
        'Monstera Deliciosa'
      );

      expect(supabase.functions.invoke).toHaveBeenCalledWith('complete-plant-info', {
        body: {
          species: 'Monstera deliciosa',
          commonName: 'Monstera Deliciosa'
        },
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      expect(result).toBeDefined();
      expect(result.plantEnvironment).toBe('interior');
    });

    it('should handle completion errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Completion failed' }
      });

      await expect(aiService.completePlantInfo(
        'Monstera deliciosa',
        'Monstera Deliciosa'
      )).rejects.toThrow();
    });
  });

  // TODO: Un-skip when generatePlantInsights function is implemented
  describe.skip('generatePlantInsights', () => {
    it('should generate insights successfully', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          insights: [
            'Tu Monstera está creciendo bien',
            'Considera rotar la maceta para un crecimiento uniforme',
            'La humedad actual es óptima'
          ],
          recommendations: [
            'Mantén el riego actual',
            'Considera fertilizar en primavera'
          ]
        },
        error: null
      });

      const result = await aiService.generatePlantInsights(mockPlant);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-plant-insights', {
        body: { plant: mockPlant },
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      expect(result).toBeDefined();
      expect(result.insights).toHaveLength(3);
      expect(result.recommendations).toHaveLength(2);
    });

    it('should handle insight generation errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Insight generation failed' }
      });

      await expect(aiService.generatePlantInsights(mockPlant)).rejects.toThrow();
    });
  });

  describe('generatePlantResponse', () => {
    it('should generate plant response successfully', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          response: '¡Hola! Soy tu Monstera y estoy muy feliz con los cuidados que me das.',
          emotion: 'happy',
          timestamp: new Date().toISOString()
        },
        error: null
      });

      const result = await aiService.generatePlantResponse(mockPlant, 'Hola planta!');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-plant-response', 
        expect.objectContaining({
          body: expect.objectContaining({
            userMessage: 'Hola planta!',
            tonePersona: 'cálido, simpático, motivador, y con un toque de humor ligero'
          }),
          headers: {
            'Authorization': 'Bearer test-token',
          },
        })
      );
      expect(result).toBeDefined();
      expect(result.response).toContain('¡Hola!');
      expect(result.emotion).toBe('happy');
    });

    it('should handle response generation errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Response generation failed' }
      });

      await expect(aiService.generatePlantResponse(
        mockPlant, 
        'Hola planta!'
      )).rejects.toThrow();
    });
  });

  // TODO: Un-skip when updateHealthDiagnosis function is implemented
  describe.skip('updateHealthDiagnosis', () => {
    it('should update health diagnosis successfully', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      const mockAnalysis: HealthAnalysis = {
        overallHealth: 'excellent',
        confidence: 95,
        issues: [],
        recommendations: ['Keep up the excellent care!'],
        moistureLevel: 75,
        growthStage: 'mature'
      };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: mockAnalysis,
        error: null
      });

      const result = await aiService.updateHealthDiagnosis({
        plantId: 'test-plant-1',
        imageData: 'data:image/jpeg;base64,new-image-data'
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith('update-health-diagnosis', {
        body: {
          plantId: 'test-plant-1',
          imageData: 'data:image/jpeg;base64,new-image-data'
        },
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      expect(result).toEqual(mockAnalysis);
    });

    it('should handle diagnosis update errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Diagnosis update failed' }
      });

      await expect(aiService.updateHealthDiagnosis({
        plantId: 'test-plant-1',
        imageData: 'data:image/jpeg;base64,new-image-data'
      })).rejects.toThrow();
    });
  });

  // TODO: Un-skip when analyzeProgressImages function is implemented
  describe.skip('analyzeProgressImages', () => {
    it('should analyze progress images successfully', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          progress: 'positive',
          growthRate: 'good',
          healthTrend: 'improving',
          recommendations: ['Continue current care routine']
        },
        error: null
      });

      const result = await aiService.analyzeProgressImages({
        plantId: 'test-plant-1',
        images: [
          'data:image/jpeg;base64,image1',
          'data:image/jpeg;base64,image2'
        ]
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith('analyze-progress-images', {
        body: {
          plantId: 'test-plant-1',
          images: [
            'data:image/jpeg;base64,image1',
            'data:image/jpeg;base64,image2'
          ]
        },
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      expect(result).toBeDefined();
      expect(result.progress).toBe('positive');
    });

    it('should handle progress analysis errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Progress analysis failed' }
      });

      await expect(aiService.analyzeProgressImages({
        plantId: 'test-plant-1',
        images: ['data:image/jpeg;base64,image1']
      })).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle invalid image data', async () => {
      const invalidImageData = 'invalid-data';

      await expect(aiService.analyzeImage(invalidImageData)).rejects.toThrow();
    });

    // TODO: Un-skip when generatePlantInsights is implemented
    it.skip('should handle empty plant data', async () => {
      const emptyPlant = { ...mockPlant, name: '', species: '' };

      await expect(aiService.generatePlantInsights(emptyPlant)).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(aiService.analyzeImage('data:image/jpeg;base64,test')).rejects.toThrow('Timeout');
    });
  });
}); 