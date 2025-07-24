import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGardenChat } from '../../../src/hooks/useGardenChat';
import { Plant } from '../../../src/schemas';

// Mock de servicios
vi.mock('../../../src/services/gardenChatService', () => ({
  gardenChatService: {
    sendMessage: vi.fn(),
    getHealthSummary: vi.fn(),
    getSuggestedQuestions: vi.fn()
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

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useGardenChat Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return garden chat functions', () => {
    const { result } = renderHook(() => useGardenChat(), {
      wrapper: TestWrapper
    });

    expect(result.current.sendMessage).toBeDefined();
    expect(result.current.getHealthSummary).toBeDefined();
    expect(result.current.getSuggestedQuestions).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should send message successfully', async () => {
    const { gardenChatService } = await import('../../../src/services/gardenChatService');
    (gardenChatService.sendMessage as any).mockResolvedValue({
      response: '¡Hola! Soy tu asistente de jardín. ¿En qué puedo ayudarte?',
      timestamp: new Date().toISOString()
    });

    const { result } = renderHook(() => useGardenChat(), {
      wrapper: TestWrapper
    });

    const message = 'Hola, ¿cómo están mis plantas?';
    const response = await result.current.sendMessage(message);

    expect(gardenChatService.sendMessage).toHaveBeenCalledWith(message);
    expect(response).toBeDefined();
    expect(response.response).toContain('¡Hola!');
  });

  it('should handle message sending errors', async () => {
    const { gardenChatService } = await import('../../../src/services/gardenChatService');
    const mockError = new Error('Failed to send message');
    (gardenChatService.sendMessage as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useGardenChat(), {
      wrapper: TestWrapper
    });

    const message = 'Hola, ¿cómo están mis plantas?';

    try {
      await result.current.sendMessage(message);
    } catch (error) {
      expect(error).toEqual(mockError);
    }
  });

  it('should get health summary successfully', async () => {
    const { gardenChatService } = await import('../../../src/services/gardenChatService');
    (gardenChatService.getHealthSummary as any).mockResolvedValue({
      summary: 'Tus plantas están en buen estado general',
      averageHealth: 85,
      needsAttention: 1
    });

    const { result } = renderHook(() => useGardenChat(), {
      wrapper: TestWrapper
    });

    const summary = await result.current.getHealthSummary(mockPlants);

    expect(gardenChatService.getHealthSummary).toHaveBeenCalledWith(mockPlants);
    expect(summary).toBeDefined();
    expect(summary.summary).toContain('buen estado');
  });

  it('should get suggested questions successfully', async () => {
    const { gardenChatService } = await import('../../../src/services/gardenChatService');
    (gardenChatService.getSuggestedQuestions as any).mockResolvedValue([
      '¿Cómo puedo mejorar el riego de mis plantas?',
      '¿Qué fertilizante recomiendas?',
      '¿Cómo detecto plagas en mis plantas?'
    ]);

    const { result } = renderHook(() => useGardenChat(), {
      wrapper: TestWrapper
    });

    const questions = await result.current.getSuggestedQuestions(mockPlants);

    expect(gardenChatService.getSuggestedQuestions).toHaveBeenCalledWith(mockPlants);
    expect(questions).toHaveLength(3);
    expect(questions[0]).toContain('riego');
  });

  it('should use cached data when available', async () => {
    const { gardenCacheService } = await import('../../../src/services/gardenCacheService');
    (gardenCacheService.getCachedContext as any).mockResolvedValue({
      totalPlants: 1,
      averageHealth: 85,
      plantsData: mockPlants
    });

    const { result } = renderHook(() => useGardenChat(), {
      wrapper: TestWrapper
    });

    const context = await result.current.buildGardenContext(mockPlants);

    expect(gardenCacheService.getCachedContext).toHaveBeenCalled();
    expect(context).toBeDefined();
    expect(context.totalPlants).toBe(1);
  });

  it('should build garden context correctly', async () => {
    const { result } = renderHook(() => useGardenChat(), {
      wrapper: TestWrapper
    });

    const context = await result.current.buildGardenContext(mockPlants);

    expect(context).toBeDefined();
    expect(context.totalPlants).toBe(1);
    expect(context.averageHealth).toBe(85);
    expect(context.plantsData).toEqual(mockPlants);
  });

  it('should handle empty plants array', async () => {
    const { result } = renderHook(() => useGardenChat(), {
      wrapper: TestWrapper
    });

    const context = await result.current.buildGardenContext([]);

    expect(context).toBeDefined();
    expect(context.totalPlants).toBe(0);
    expect(context.averageHealth).toBe(0);
    expect(context.plantsData).toEqual([]);
  });

  it('should handle loading states', async () => {
    const { gardenChatService } = await import('../../../src/services/gardenChatService');
    (gardenChatService.sendMessage as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useGardenChat(), {
      wrapper: TestWrapper
    });

    const message = 'Hola, ¿cómo están mis plantas?';
    const sendPromise = result.current.sendMessage(message);

    // Verificar estado de carga
    expect(result.current.isLoading).toBe(true);

    await sendPromise;

    // Verificar que el estado de carga se resetea
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle cache misses', async () => {
    const { gardenCacheService } = await import('../../../src/services/gardenCacheService');
    (gardenCacheService.getCachedContext as any).mockResolvedValue(null);

    const { result } = renderHook(() => useGardenChat(), {
      wrapper: TestWrapper
    });

    const context = await result.current.buildGardenContext(mockPlants);

    expect(context).toBeDefined();
    expect(gardenCacheService.setCachedContext).toHaveBeenCalled();
  });

  it('should handle invalid plant data', async () => {
    const { result } = renderHook(() => useGardenChat(), {
      wrapper: TestWrapper
    });

    const invalidPlants = [
      { ...mockPlants[0], healthScore: undefined },
      { ...mockPlants[0], healthScore: null }
    ];

    const context = await result.current.buildGardenContext(invalidPlants as any);

    expect(context).toBeDefined();
    expect(context.averageHealth).toBe(0);
  });

  it('should handle network errors gracefully', async () => {
    const { gardenChatService } = await import('../../../src/services/gardenChatService');
    const networkError = new Error('Network error');
    (gardenChatService.sendMessage as any).mockRejectedValue(networkError);

    const { result } = renderHook(() => useGardenChat(), {
      wrapper: TestWrapper
    });

    const message = 'Hola, ¿cómo están mis plantas?';

    try {
      await result.current.sendMessage(message);
    } catch (error) {
      expect(error).toEqual(networkError);
    }

    expect(result.current.error).toBeDefined();
  });
}); 