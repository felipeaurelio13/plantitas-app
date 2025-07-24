import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gardenCacheService } from '../../../src/services/gardenCacheService';
import { Plant } from '../../../src/schemas';

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

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

const mockGardenContext = {
  totalPlants: 1,
  averageHealth: 85,
  plantsData: mockPlants,
  environmentTypes: ['interior'],
  lightRequirements: ['luz_indirecta'],
  careNeeds: ['watering', 'fertilizing']
};

const mockHealthSummary = {
  summary: 'Tus plantas están en buen estado general',
  averageHealth: 85,
  needsAttention: 1,
  recommendations: ['Mantén el riego actual', 'Considera fertilizar en primavera']
};

const mockSuggestedQuestions = [
  '¿Cómo puedo mejorar el riego de mis plantas?',
  '¿Qué fertilizante recomiendas?',
  '¿Cómo detecto plagas en mis plantas?'
];

describe('gardenCacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('getCachedContext', () => {
    it('should get cached garden context successfully', () => {
      const cachedData = {
        data: mockGardenContext,
        timestamp: Date.now()
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = gardenCacheService.getCachedContext();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('garden_context_cache');
      expect(result).toEqual(mockGardenContext);
    });

    it('should return null when no cached context exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = gardenCacheService.getCachedContext();

      expect(result).toBeNull();
    });

    it('should return null when cache is expired', () => {
      const expiredData = {
        data: mockGardenContext,
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData));

      const result = gardenCacheService.getCachedContext();

      expect(result).toBeNull();
    });

    it('should handle invalid cached data', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = gardenCacheService.getCachedContext();

      expect(result).toBeNull();
    });
  });

  describe('setCachedContext', () => {
    it('should set garden context cache successfully', () => {
      gardenCacheService.setCachedContext(mockGardenContext);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'garden_context_cache',
        expect.stringContaining(JSON.stringify(mockGardenContext))
      );
    });

    it('should include timestamp in cached data', () => {
      gardenCacheService.setCachedContext(mockGardenContext);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const cachedData = JSON.parse(setItemCall[1]);

      expect(cachedData).toHaveProperty('data');
      expect(cachedData).toHaveProperty('timestamp');
      expect(cachedData.data).toEqual(mockGardenContext);
      expect(typeof cachedData.timestamp).toBe('number');
    });
  });

  describe('getCachedSummary', () => {
    it('should get cached health summary successfully', () => {
      const cachedData = {
        data: mockHealthSummary,
        timestamp: Date.now()
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = gardenCacheService.getCachedSummary();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('garden_summary_cache');
      expect(result).toEqual(mockHealthSummary);
    });

    it('should return null when no cached summary exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = gardenCacheService.getCachedSummary();

      expect(result).toBeNull();
    });

    it('should return null when summary cache is expired', () => {
      const expiredData = {
        data: mockHealthSummary,
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData));

      const result = gardenCacheService.getCachedSummary();

      expect(result).toBeNull();
    });
  });

  describe('setCachedSummary', () => {
    it('should set health summary cache successfully', () => {
      gardenCacheService.setCachedSummary(mockHealthSummary);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'garden_summary_cache',
        expect.stringContaining(JSON.stringify(mockHealthSummary))
      );
    });

    it('should include timestamp in cached summary data', () => {
      gardenCacheService.setCachedSummary(mockHealthSummary);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const cachedData = JSON.parse(setItemCall[1]);

      expect(cachedData).toHaveProperty('data');
      expect(cachedData).toHaveProperty('timestamp');
      expect(cachedData.data).toEqual(mockHealthSummary);
    });
  });

  describe('getCachedQuestions', () => {
    it('should get cached suggested questions successfully', () => {
      const cachedData = {
        data: mockSuggestedQuestions,
        timestamp: Date.now()
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = gardenCacheService.getCachedQuestions();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('garden_questions_cache');
      expect(result).toEqual(mockSuggestedQuestions);
    });

    it('should return null when no cached questions exist', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = gardenCacheService.getCachedQuestions();

      expect(result).toBeNull();
    });

    it('should return null when questions cache is expired', () => {
      const expiredData = {
        data: mockSuggestedQuestions,
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData));

      const result = gardenCacheService.getCachedQuestions();

      expect(result).toBeNull();
    });
  });

  describe('setCachedQuestions', () => {
    it('should set suggested questions cache successfully', () => {
      gardenCacheService.setCachedQuestions(mockSuggestedQuestions);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'garden_questions_cache',
        expect.stringContaining(JSON.stringify(mockSuggestedQuestions))
      );
    });

    it('should include timestamp in cached questions data', () => {
      gardenCacheService.setCachedQuestions(mockSuggestedQuestions);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const cachedData = JSON.parse(setItemCall[1]);

      expect(cachedData).toHaveProperty('data');
      expect(cachedData).toHaveProperty('timestamp');
      expect(cachedData.data).toEqual(mockSuggestedQuestions);
    });
  });

  describe('clearCache', () => {
    it('should clear all garden cache successfully', () => {
      gardenCacheService.clearCache();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('garden_context_cache');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('garden_summary_cache');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('garden_questions_cache');
    });

    it('should clear specific cache item', () => {
      gardenCacheService.clearCache('context');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('garden_context_cache');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('garden_summary_cache');
    });
  });

  describe('isCacheValid', () => {
    it('should return true for valid cache', () => {
      const validData = {
        data: mockGardenContext,
        timestamp: Date.now()
      };

      const result = gardenCacheService.isCacheValid(validData);

      expect(result).toBe(true);
    });

    it('should return false for expired cache', () => {
      const expiredData = {
        data: mockGardenContext,
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      const result = gardenCacheService.isCacheValid(expiredData);

      expect(result).toBe(false);
    });

    it('should return false for invalid cache data', () => {
      const invalidData = {
        data: null,
        timestamp: Date.now()
      };

      const result = gardenCacheService.isCacheValid(invalidData);

      expect(result).toBe(false);
    });

    it('should return false for cache without timestamp', () => {
      const invalidData = {
        data: mockGardenContext
      };

      const result = gardenCacheService.isCacheValid(invalidData);

      expect(result).toBe(false);
    });
  });

  describe('getCacheAge', () => {
    it('should return correct cache age in hours', () => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const cachedData = {
        data: mockGardenContext,
        timestamp: oneHourAgo
      };

      const result = gardenCacheService.getCacheAge(cachedData);

      expect(result).toBeCloseTo(1, 1); // Approximately 1 hour
    });

    it('should return 0 for current timestamp', () => {
      const currentData = {
        data: mockGardenContext,
        timestamp: Date.now()
      };

      const result = gardenCacheService.getCacheAge(currentData);

      expect(result).toBeCloseTo(0, 1);
    });
  });

  describe('getCacheSize', () => {
    it('should return cache size in bytes', () => {
      const cachedData = {
        data: mockGardenContext,
        timestamp: Date.now()
      };

      const result = gardenCacheService.getCacheSize(cachedData);

      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    it('should return 0 for null data', () => {
      const result = gardenCacheService.getCacheSize(null);

      expect(result).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = gardenCacheService.getCachedContext();

      expect(result).toBeNull();
    });

    it('should handle setItem errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage setItem error');
      });

      // Should not throw error
      expect(() => {
        gardenCacheService.setCachedContext(mockGardenContext);
      }).not.toThrow();
    });

    it('should handle removeItem errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage removeItem error');
      });

      // Should not throw error
      expect(() => {
        gardenCacheService.clearCache();
      }).not.toThrow();
    });

    it('should handle malformed JSON in cache', () => {
      localStorageMock.getItem.mockReturnValue('{invalid:json}');

      const result = gardenCacheService.getCachedContext();

      expect(result).toBeNull();
    });

    it('should handle missing data property in cache', () => {
      const invalidData = {
        timestamp: Date.now()
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidData));

      const result = gardenCacheService.getCachedContext();

      expect(result).toBeNull();
    });
  });

  describe('cache performance', () => {
    it('should handle large cache data', () => {
      const largeData = {
        data: {
          ...mockGardenContext,
          largeArray: new Array(10000).fill('test')
        },
        timestamp: Date.now()
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(largeData));

      const result = gardenCacheService.getCachedContext();

      expect(result).toBeDefined();
    });

    it('should handle multiple cache operations', () => {
      gardenCacheService.setCachedContext(mockGardenContext);
      gardenCacheService.setCachedSummary(mockHealthSummary);
      gardenCacheService.setCachedQuestions(mockSuggestedQuestions);

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3);
    });
  });
}); 