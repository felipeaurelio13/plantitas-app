import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GardenChatService } from '../../../src/services/gardenChatService';
import { supabaseMock, gardenCacheMock } from '../../mocks/services';

// Mockear las dependencias usando los mocks importados
vi.mock('../../../src/lib/supabase', () => ({
  supabase: supabaseMock,
}));
vi.mock('../../../src/services/gardenCacheService', () => ({
  gardenCacheService: gardenCacheMock,
}));

const mockPlants = [
  { id: 'plant-1', name: 'Monstera' /* ...otros datos... */ },
];
const mockFullContext = {
  totalPlants: 1,
  plantsData: mockPlants,
  averageHealthScore: 90,
  careScheduleSummary: { needsWatering: [], healthConcerns: [] },
  // ...otros datos...
};

describe('GardenChatService', () => {
  let serviceInstance: GardenChatService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Inyectamos los mocks directamente en la instancia
    serviceInstance = new GardenChatService(supabaseMock as any, gardenCacheMock as any);
    (supabaseMock.order as any).mockResolvedValue({ data: mockPlants, error: null });
  });

  describe('sendMessageToGardenAI', () => {
    it('should send a message and get a response from the AI', async () => {
      const mockResponse = {
        content: 'Your plants are doing great!',
        insights: ['Keep up the good work'],
        suggestedActions: [],
      };
      (supabaseMock.functions.invoke as any).mockResolvedValue({ data: mockResponse, error: null });

      const result = await serviceInstance.sendMessageToGardenAI('How are my plants?', 'user-123', []);

      expect(supabaseMock.functions.invoke).toHaveBeenCalledWith(
        'garden-ai-chat',
        expect.objectContaining({
          body: expect.objectContaining({
            userMessage: 'How are my plants?',
          }),
        })
      );
      expect(result.content).toBe(mockResponse.content);
    });
  });

  describe('buildGardenContext', () => {
    it('should build context from DB when cache is empty', async () => {
      gardenCacheMock.getGardenContext.mockReturnValue(null);
      
      const context = await serviceInstance.buildGardenContext('user-123');

      expect(gardenCacheMock.getGardenContext).toHaveBeenCalledWith('user-123');
      expect(supabaseMock.from).toHaveBeenCalledWith('plants');
      expect(gardenCacheMock.setGardenContext).toHaveBeenCalledWith('user-123', context);
      expect(context.totalPlants).toBe(1);
    });

    it('should return context from cache if available', async () => {
      gardenCacheMock.getGardenContext.mockReturnValue(mockFullContext);
      
      const context = await serviceInstance.buildGardenContext('user-123');
      
      expect(gardenCacheMock.getGardenContext).toHaveBeenCalledWith('user-123');
      expect(supabaseMock.from).not.toHaveBeenCalled();
      expect(context).toEqual(mockFullContext);
    });
  });

  describe('getGardenHealthSummary', () => {
    it('should calculate health summary correctly', async () => {
      // Forzamos a que buildGardenContext devuelva el mock (a través del caché)
      gardenCacheMock.getGardenContext.mockReturnValue(mockFullContext);
      
      const summary = await serviceInstance.getGardenHealthSummary('user-123');

      expect(summary.totalPlants).toBe(1);
      expect(summary.averageHealth).toBe(90);
      expect(summary.healthyPlants).toBe(1);
    });
  });

  describe('getSuggestedQuestions', () => {
    it('should provide relevant questions based on garden context', async () => {
      gardenCacheMock.getGardenContext.mockReturnValue(mockFullContext);
      
      const questions = await serviceInstance.getSuggestedQuestions('user-123');

      expect(questions.length).toBeGreaterThan(0);
      expect(questions).toContain('¿Cuáles de mis plantas están más sanas?');
    });

    it('should provide introductory questions for an empty garden', async () => {
      const emptyContext = { ...mockFullContext, totalPlants: 0, plantsData: [] };
      gardenCacheMock.getGardenContext.mockReturnValue(emptyContext);
      
      const questions = await serviceInstance.getSuggestedQuestions('user-123');
      
      expect(questions).toContain('¿Cómo agrego mi primera planta?');
    });
  });
}); 