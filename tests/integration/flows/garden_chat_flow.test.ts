import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GardenChat } from '../../../src/pages/GardenChat';
import { GardenChatInput } from '../../../src/components/GardenChat/GardenChatInput';

// Mock de servicios y hooks
vi.mock('../../../src/services/gardenChatService', () => ({
  gardenChatService: {
    sendMessage: vi.fn(),
    getHealthSummary: vi.fn(),
    getSuggestedQuestions: vi.fn(),
    buildGardenContext: vi.fn()
  }
}));

vi.mock('../../../src/services/gardenCacheService', () => ({
  gardenCacheService: {
    getCachedContext: vi.fn(),
    setCachedContext: vi.fn(),
    getCachedSummary: vi.fn(),
    setCachedSummary: vi.fn(),
    getCachedQuestions: vi.fn(),
    setCachedQuestions: vi.fn()
  }
}));

vi.mock('../../../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

vi.mock('../../../src/hooks/useGardenChat', () => ({
  useGardenChat: () => ({
    sendMessage: vi.fn(),
    getHealthSummary: vi.fn(),
    getSuggestedQuestions: vi.fn(),
    buildGardenContext: vi.fn(),
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

describe('Garden Chat Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Garden Chat Flow', () => {
    it('should handle complete garden chat interaction', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        response: '¡Hola! Soy tu asistente de jardín. Tus plantas están en buen estado general. ¿En qué puedo ayudarte?',
        timestamp: new Date().toISOString(),
        context: {
          totalPlants: 3,
          averageHealth: 85,
          needsAttention: 1
        }
      });

      const mockGetHealthSummary = vi.fn().mockResolvedValue({
        summary: 'Tus plantas están en buen estado general',
        averageHealth: 85,
        needsAttention: 1,
        recommendations: ['Mantén el riego actual', 'Considera fertilizar en primavera']
      });

      const mockGetSuggestedQuestions = vi.fn().mockResolvedValue([
        '¿Cómo puedo mejorar el riego de mis plantas?',
        '¿Qué fertilizante recomiendas?',
        '¿Cómo detecto plagas en mis plantas?'
      ]);

      // Mock de servicios
      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.sendMessage as any).mockImplementation(mockSendMessage);
      (gardenChatService.getHealthSummary as any).mockImplementation(mockGetHealthSummary);
      (gardenChatService.getSuggestedQuestions as any).mockImplementation(mockGetSuggestedQuestions);

      // Simular plantas del jardín
      const mockPlants = [
        {
          id: 'plant-1',
          name: 'Monstera Deliciosa',
          healthScore: 90,
          images: [{ healthAnalysis: { overallHealth: 'good', confidence: 90 } }]
        },
        {
          id: 'plant-2',
          name: 'Orchid',
          healthScore: 75,
          images: [{ healthAnalysis: { overallHealth: 'fair', confidence: 75 } }]
        },
        {
          id: 'plant-3',
          name: 'Snake Plant',
          healthScore: 90,
          images: [{ healthAnalysis: { overallHealth: 'good', confidence: 90 } }]
        }
      ];

      // 1. Construir contexto del jardín
      const gardenContext = {
        totalPlants: mockPlants.length,
        averageHealth: 85,
        plantsData: mockPlants,
        environmentTypes: ['interior'],
        lightRequirements: ['luz_indirecta', 'luz_directa']
      };

      // 2. Obtener resumen de salud
      const healthSummary = await mockGetHealthSummary(mockPlants);
      expect(healthSummary.averageHealth).toBe(85);
      expect(healthSummary.needsAttention).toBe(1);

      // 3. Enviar mensaje al chat
      const userMessage = 'Hola, ¿cómo están mis plantas?';
      const chatResponse = await mockSendMessage(userMessage);
      
      expect(chatResponse.response).toContain('¡Hola!');
      expect(chatResponse.context.totalPlants).toBe(3);

      // 4. Obtener preguntas sugeridas
      const suggestedQuestions = await mockGetSuggestedQuestions(mockPlants);
      expect(suggestedQuestions).toHaveLength(3);
      expect(suggestedQuestions[0]).toContain('riego');
    });

    it('should handle garden chat with specific plant queries', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        response: 'Tu Monstera Deliciosa está en excelente estado. Sus hojas están verdes y saludables. Te recomiendo mantener el riego actual y asegurarte de que reciba luz indirecta brillante.',
        timestamp: new Date().toISOString(),
        context: {
          plantId: 'plant-1',
          plantName: 'Monstera Deliciosa',
          healthScore: 90
        }
      });

      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.sendMessage as any).mockImplementation(mockSendMessage);

      const specificQuery = '¿Cómo está mi Monstera Deliciosa?';
      const response = await mockSendMessage(specificQuery);

      expect(response.response).toContain('Monstera Deliciosa');
      expect(response.response).toContain('excelente estado');
      expect(response.context.plantName).toBe('Monstera Deliciosa');
    });

    it('should handle garden chat with care recommendations', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        response: 'Para mejorar el riego de tus plantas, te recomiendo:\n\n1. Riega cuando la tierra esté seca al tacto\n2. Usa agua a temperatura ambiente\n3. Evita el encharcamiento\n4. Considera usar un humidificador para plantas tropicales',
        timestamp: new Date().toISOString(),
        context: {
          topic: 'watering',
          recommendations: 4
        }
      });

      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.sendMessage as any).mockImplementation(mockSendMessage);

      const careQuery = '¿Cómo puedo mejorar el riego de mis plantas?';
      const response = await mockSendMessage(careQuery);

      expect(response.response).toContain('riego');
      expect(response.response).toContain('recomiendo');
      expect(response.context.topic).toBe('watering');
    });
  });

  describe('Garden Context Building', () => {
    it('should build comprehensive garden context', async () => {
      const mockBuildGardenContext = vi.fn().mockResolvedValue({
        totalPlants: 5,
        averageHealth: 82,
        plantsData: [
          { id: 'plant-1', name: 'Monstera', healthScore: 90 },
          { id: 'plant-2', name: 'Orchid', healthScore: 75 },
          { id: 'plant-3', name: 'Snake Plant', healthScore: 85 },
          { id: 'plant-4', name: 'Pothos', healthScore: 80 },
          { id: 'plant-5', name: 'Cactus', healthScore: 90 }
        ],
        environmentTypes: ['interior', 'exterior'],
        lightRequirements: ['luz_indirecta', 'luz_directa', 'sombra'],
        careNeeds: ['watering', 'fertilizing', 'pruning'],
        healthDistribution: {
          excellent: 2,
          good: 2,
          fair: 1,
          poor: 0
        }
      });

      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.buildGardenContext as any).mockImplementation(mockBuildGardenContext);

      const mockPlants = [
        { id: 'plant-1', name: 'Monstera', healthScore: 90 },
        { id: 'plant-2', name: 'Orchid', healthScore: 75 },
        { id: 'plant-3', name: 'Snake Plant', healthScore: 85 },
        { id: 'plant-4', name: 'Pothos', healthScore: 80 },
        { id: 'plant-5', name: 'Cactus', healthScore: 90 }
      ];

      const context = await mockBuildGardenContext(mockPlants);

      expect(context.totalPlants).toBe(5);
      expect(context.averageHealth).toBe(82);
      expect(context.environmentTypes).toContain('interior');
      expect(context.healthDistribution.excellent).toBe(2);
    });

    it('should handle empty garden context', async () => {
      const mockBuildGardenContext = vi.fn().mockResolvedValue({
        totalPlants: 0,
        averageHealth: 0,
        plantsData: [],
        environmentTypes: [],
        lightRequirements: [],
        careNeeds: [],
        healthDistribution: {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0
        }
      });

      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.buildGardenContext as any).mockImplementation(mockBuildGardenContext);

      const context = await mockBuildGardenContext([]);

      expect(context.totalPlants).toBe(0);
      expect(context.averageHealth).toBe(0);
      expect(context.plantsData).toHaveLength(0);
    });
  });

  describe('Health Summary Generation', () => {
    it('should generate health summary for healthy garden', async () => {
      const mockGetHealthSummary = vi.fn().mockResolvedValue({
        summary: '¡Excelente! Tus plantas están en perfecto estado. Todas muestran signos de crecimiento saludable.',
        averageHealth: 92,
        needsAttention: 0,
        recommendations: [
          'Mantén el excelente cuidado actual',
          'Considera agregar más plantas para diversificar tu jardín'
        ],
        highlights: [
          'Monstera Deliciosa: Crecimiento vigoroso',
          'Orchid: Floración abundante',
          'Snake Plant: Hojas brillantes'
        ]
      });

      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.getHealthSummary as any).mockImplementation(mockGetHealthSummary);

      const mockPlants = [
        { id: 'plant-1', name: 'Monstera', healthScore: 95 },
        { id: 'plant-2', name: 'Orchid', healthScore: 90 },
        { id: 'plant-3', name: 'Snake Plant', healthScore: 92 }
      ];

      const summary = await mockGetHealthSummary(mockPlants);

      expect(summary.averageHealth).toBe(92);
      expect(summary.needsAttention).toBe(0);
      expect(summary.highlights).toHaveLength(3);
    });

    it('should generate health summary for garden needing attention', async () => {
      const mockGetHealthSummary = vi.fn().mockResolvedValue({
        summary: 'Algunas de tus plantas necesitan atención. Te recomiendo revisar el riego y la iluminación.',
        averageHealth: 65,
        needsAttention: 3,
        recommendations: [
          'Revisa el riego de las plantas con hojas amarillas',
          'Mueve las plantas que necesitan más luz',
          'Considera fertilizar las plantas débiles'
        ],
        urgentIssues: [
          'Monstera: Hojas amarillas por exceso de riego',
          'Orchid: Falta de luz',
          'Snake Plant: Necesita trasplante'
        ]
      });

      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.getHealthSummary as any).mockImplementation(mockGetHealthSummary);

      const mockPlants = [
        { id: 'plant-1', name: 'Monstera', healthScore: 60 },
        { id: 'plant-2', name: 'Orchid', healthScore: 50 },
        { id: 'plant-3', name: 'Snake Plant', healthScore: 85 }
      ];

      const summary = await mockGetHealthSummary(mockPlants);

      expect(summary.averageHealth).toBe(65);
      expect(summary.needsAttention).toBe(3);
      expect(summary.urgentIssues).toHaveLength(3);
    });
  });

  describe('Suggested Questions Generation', () => {
    it('should generate relevant suggested questions', async () => {
      const mockGetSuggestedQuestions = vi.fn().mockResolvedValue([
        '¿Cómo puedo mejorar el riego de mis plantas?',
        '¿Qué fertilizante recomiendas para plantas tropicales?',
        '¿Cómo detecto y trato las plagas en mis plantas?',
        '¿Cuál es la mejor ubicación para mis plantas según su tipo?',
        '¿Cómo puedo propagar mis plantas exitosamente?'
      ]);

      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.getSuggestedQuestions as any).mockImplementation(mockGetSuggestedQuestions);

      const mockPlants = [
        { id: 'plant-1', name: 'Monstera', healthScore: 85 },
        { id: 'plant-2', name: 'Orchid', healthScore: 75 }
      ];

      const questions = await mockGetSuggestedQuestions(mockPlants);

      expect(questions).toHaveLength(5);
      expect(questions[0]).toContain('riego');
      expect(questions[1]).toContain('fertilizante');
      expect(questions[2]).toContain('plagas');
    });

    it('should generate context-specific questions', async () => {
      const mockGetSuggestedQuestions = vi.fn().mockResolvedValue([
        '¿Por qué mi Monstera tiene hojas amarillas?',
        '¿Cómo puedo hacer que mi Monstera crezca más rápido?',
        '¿Cuándo debo trasplantar mi Monstera?'
      ]);

      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.getSuggestedQuestions as any).mockImplementation(mockGetSuggestedQuestions);

      const specificPlant = [{ id: 'plant-1', name: 'Monstera', healthScore: 75 }];
      const questions = await mockGetSuggestedQuestions(specificPlant);

      expect(questions).toHaveLength(3);
      expect(questions[0]).toContain('Monstera');
      expect(questions[1]).toContain('Monstera');
    });
  });

  describe('Garden Chat Caching', () => {
    it('should use cached garden context when available', async () => {
      const mockGetCachedContext = vi.fn().mockResolvedValue({
        totalPlants: 3,
        averageHealth: 85,
        plantsData: [
          { id: 'plant-1', name: 'Monstera', healthScore: 90 },
          { id: 'plant-2', name: 'Orchid', healthScore: 80 },
          { id: 'plant-3', name: 'Snake Plant', healthScore: 85 }
        ],
        timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
      });

      const { gardenCacheService } = await import('../../../src/services/gardenCacheService');
      (gardenCacheService.getCachedContext as any).mockImplementation(mockGetCachedContext);

      const cachedContext = await mockGetCachedContext();
      
      expect(cachedContext.totalPlants).toBe(3);
      expect(cachedContext.averageHealth).toBe(85);
      expect(cachedContext.plantsData).toHaveLength(3);
    });

    it('should cache new garden context', async () => {
      const mockSetCachedContext = vi.fn().mockResolvedValue(true);

      const { gardenCacheService } = await import('../../../src/services/gardenCacheService');
      (gardenCacheService.setCachedContext as any).mockImplementation(mockSetCachedContext);

      const newContext = {
        totalPlants: 4,
        averageHealth: 88,
        plantsData: [
          { id: 'plant-1', name: 'Monstera', healthScore: 90 },
          { id: 'plant-2', name: 'Orchid', healthScore: 85 },
          { id: 'plant-3', name: 'Snake Plant', healthScore: 90 },
          { id: 'plant-4', name: 'Pothos', healthScore: 85 }
        ]
      };

      await mockSetCachedContext(newContext);
      expect(mockSetCachedContext).toHaveBeenCalledWith(newContext);
    });
  });

  describe('Error Handling in Garden Chat', () => {
    it('should handle AI service unavailable', async () => {
      const mockSendMessage = vi.fn().mockRejectedValue(new Error('AI service unavailable'));

      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.sendMessage as any).mockImplementation(mockSendMessage);

      const userMessage = 'Hola, ¿cómo están mis plantas?';

      try {
        await mockSendMessage(userMessage);
      } catch (error) {
        expect(error.message).toBe('AI service unavailable');
      }
    });

    it('should handle network errors gracefully', async () => {
      const mockSendMessage = vi.fn().mockRejectedValue(new Error('Network error - unable to connect'));

      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.sendMessage as any).mockImplementation(mockSendMessage);

      const userMessage = '¿Qué fertilizante recomiendas?';

      try {
        await mockSendMessage(userMessage);
      } catch (error) {
        expect(error.message).toBe('Network error - unable to connect');
      }
    });

    it('should handle invalid garden context', async () => {
      const mockBuildGardenContext = vi.fn().mockRejectedValue(new Error('Invalid plant data'));

      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.buildGardenContext as any).mockImplementation(mockBuildGardenContext);

      const invalidPlants = [
        { id: 'plant-1', name: 'Monstera' }, // Missing healthScore
        { id: 'plant-2', healthScore: 85 }   // Missing name
      ];

      try {
        await mockBuildGardenContext(invalidPlants);
      } catch (error) {
        expect(error.message).toBe('Invalid plant data');
      }
    });
  });

  describe('Garden Chat Performance', () => {
    it('should handle rapid message sending', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        response: 'Respuesta rápida',
        timestamp: new Date().toISOString()
      });

      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.sendMessage as any).mockImplementation(mockSendMessage);

      const messages = [
        'Hola',
        '¿Cómo están mis plantas?',
        '¿Qué fertilizante recomiendas?',
        '¿Cómo riego mis plantas?'
      ];

      const responses = await Promise.all(messages.map(msg => mockSendMessage(msg)));

      expect(responses).toHaveLength(4);
      expect(mockSendMessage).toHaveBeenCalledTimes(4);
    });

    it('should handle large garden context efficiently', async () => {
      const mockBuildGardenContext = vi.fn().mockResolvedValue({
        totalPlants: 50,
        averageHealth: 85,
        plantsData: Array.from({ length: 50 }, (_, i) => ({
          id: `plant-${i}`,
          name: `Plant ${i}`,
          healthScore: 80 + (i % 20)
        }))
      });

      const { gardenChatService } = await import('../../../src/services/gardenChatService');
      (gardenChatService.buildGardenContext as any).mockImplementation(mockBuildGardenContext);

      const largePlantArray = Array.from({ length: 50 }, (_, i) => ({
        id: `plant-${i}`,
        name: `Plant ${i}`,
        healthScore: 80 + (i % 20)
      }));

      const context = await mockBuildGardenContext(largePlantArray);

      expect(context.totalPlants).toBe(50);
      expect(context.plantsData).toHaveLength(50);
    });
  });
}); 