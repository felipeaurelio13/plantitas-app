import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gardenChatService } from '../../../src/services/gardenChatService';
import { Plant } from '../../../src/schemas';

// Mock de Supabase
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

const mockPlants: Plant[] = [
  {
    id: 'plant-1',
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
  }
];

describe('gardenChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send garden message successfully', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          response: '¡Hola! Soy tu asistente de jardín. Tus plantas están en buen estado.',
          timestamp: new Date().toISOString()
        },
        error: null
      });

      const message = 'Hola, ¿cómo están mis plantas?';
      const result = await gardenChatService.sendMessage(message);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('garden-ai-chat', {
        body: { message }
      });
      expect(result).toBeDefined();
      expect(result.response).toContain('¡Hola!');
    });

    it('should handle garden message errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Garden chat failed' }
      });

      const message = 'Hola, ¿cómo están mis plantas?';

      await expect(gardenChatService.sendMessage(message)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockRejectedValue(new Error('Network error'));

      const message = 'Hola, ¿cómo están mis plantas?';

      await expect(gardenChatService.sendMessage(message)).rejects.toThrow('Network error');
    });

    it('should handle empty messages', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          response: 'Por favor, escribe un mensaje para poder ayudarte.',
          timestamp: new Date().toISOString()
        },
        error: null
      });

      const result = await gardenChatService.sendMessage('');

      expect(result.response).toContain('Por favor, escribe un mensaje');
    });
  });

  describe('getHealthSummary', () => {
    it('should get health summary successfully', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          summary: 'Tus plantas están en buen estado general',
          averageHealth: 85,
          needsAttention: 1,
          recommendations: ['Mantén el riego actual', 'Considera fertilizar en primavera']
        },
        error: null
      });

      const result = await gardenChatService.getHealthSummary(mockPlants);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('garden-ai-chat', {
        body: { 
          action: 'get_health_summary',
          plants: mockPlants
        }
      });
      expect(result).toBeDefined();
      expect(result.summary).toContain('buen estado');
      expect(result.averageHealth).toBe(85);
    });

    it('should handle health summary errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Health summary failed' }
      });

      await expect(gardenChatService.getHealthSummary(mockPlants)).rejects.toThrow();
    });

    it('should handle empty plants array', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          summary: 'No tienes plantas registradas aún',
          averageHealth: 0,
          needsAttention: 0,
          recommendations: ['Agrega tu primera planta para comenzar']
        },
        error: null
      });

      const result = await gardenChatService.getHealthSummary([]);

      expect(result.summary).toContain('No tienes plantas');
      expect(result.averageHealth).toBe(0);
    });
  });

  describe('getSuggestedQuestions', () => {
    it('should get suggested questions successfully', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: [
          '¿Cómo puedo mejorar el riego de mis plantas?',
          '¿Qué fertilizante recomiendas?',
          '¿Cómo detecto plagas en mis plantas?',
          '¿Cuál es la mejor época para trasplantar?'
        ],
        error: null
      });

      const result = await gardenChatService.getSuggestedQuestions(mockPlants);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('garden-ai-chat', {
        body: { 
          action: 'get_suggested_questions',
          plants: mockPlants
        }
      });
      expect(result).toHaveLength(4);
      expect(result[0]).toContain('riego');
    });

    it('should handle suggested questions errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Suggested questions failed' }
      });

      await expect(gardenChatService.getSuggestedQuestions(mockPlants)).rejects.toThrow();
    });

    it('should return default questions for empty garden', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: [
          '¿Cómo empiezo mi jardín?',
          '¿Qué plantas son buenas para principiantes?',
          '¿Qué necesito para cuidar plantas?'
        ],
        error: null
      });

      const result = await gardenChatService.getSuggestedQuestions([]);

      expect(result).toHaveLength(3);
      expect(result[0]).toContain('empiezo');
    });
  });

  describe('buildGardenContext', () => {
    it('should build garden context successfully', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          totalPlants: 1,
          averageHealth: 85,
          plantsData: mockPlants,
          environmentTypes: ['interior'],
          lightRequirements: ['luz_indirecta'],
          careNeeds: ['watering', 'fertilizing']
        },
        error: null
      });

      const result = await gardenChatService.buildGardenContext(mockPlants);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('garden-ai-chat', {
        body: { 
          action: 'build_garden_context',
          plants: mockPlants
        }
      });
      expect(result).toBeDefined();
      expect(result.totalPlants).toBe(1);
      expect(result.averageHealth).toBe(85);
    });

    it('should handle garden context errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Garden context failed' }
      });

      await expect(gardenChatService.buildGardenContext(mockPlants)).rejects.toThrow();
    });

    it('should handle plants with missing data', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      const incompletePlants = [
        { ...mockPlants[0], healthScore: undefined },
        { ...mockPlants[0], healthScore: null }
      ];

      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          totalPlants: 2,
          averageHealth: 0,
          plantsData: incompletePlants,
          environmentTypes: ['interior'],
          lightRequirements: ['luz_indirecta'],
          careNeeds: ['watering']
        },
        error: null
      });

      const result = await gardenChatService.buildGardenContext(incompletePlants as any);

      expect(result.averageHealth).toBe(0);
    });
  });

  describe('getPlantInsights', () => {
    it('should get plant insights successfully', async () => {
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
          ],
          growthTrend: 'positive',
          careScore: 85
        },
        error: null
      });

      const result = await gardenChatService.getPlantInsights(mockPlants[0]);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('garden-ai-chat', {
        body: { 
          action: 'get_plant_insights',
          plant: mockPlants[0]
        }
      });
      expect(result).toBeDefined();
      expect(result.insights).toHaveLength(3);
      expect(result.growthTrend).toBe('positive');
    });

    it('should handle plant insights errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Plant insights failed' }
      });

      await expect(gardenChatService.getPlantInsights(mockPlants[0])).rejects.toThrow();
    });
  });

  describe('getCareRecommendations', () => {
    it('should get care recommendations successfully', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: {
          recommendations: [
            'Riega cuando el suelo esté seco al tacto',
            'Mantén la planta en luz indirecta brillante',
            'Fertiliza cada 2-3 meses durante la temporada de crecimiento'
          ],
          priority: 'medium',
          nextAction: 'watering',
          estimatedTime: '5 minutes'
        },
        error: null
      });

      const result = await gardenChatService.getCareRecommendations(mockPlants[0]);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('garden-ai-chat', {
        body: { 
          action: 'get_care_recommendations',
          plant: mockPlants[0]
        }
      });
      expect(result).toBeDefined();
      expect(result.recommendations).toHaveLength(3);
      expect(result.priority).toBe('medium');
    });

    it('should handle care recommendations errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Care recommendations failed' }
      });

      await expect(gardenChatService.getCareRecommendations(mockPlants[0])).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle invalid plant data', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Invalid plant data' }
      });

      const invalidPlant = { id: 'invalid' } as any;

      await expect(gardenChatService.getPlantInsights(invalidPlant)).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(gardenChatService.sendMessage('test')).rejects.toThrow('Timeout');
    });

    it('should handle malformed responses', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockResolvedValue({
        data: 'invalid-response',
        error: null
      });

      await expect(gardenChatService.sendMessage('test')).rejects.toThrow();
    });

    it('should handle function not found errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.functions.invoke as any).mockRejectedValue(new Error('Function not found'));

      await expect(gardenChatService.sendMessage('test')).rejects.toThrow('Function not found');
    });
  });
}); 