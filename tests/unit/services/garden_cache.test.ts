import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GardenCacheService } from '../src/services/gardenCacheService';
import { GardenAnalysisContext, PlantSummary } from '../src/schemas';

describe('GardenCacheService', () => {
  let cacheService: GardenCacheService;
  const userId = 'test-user-123';

  const mockGardenContext: GardenAnalysisContext = {
    totalPlants: 3,
    plantsData: [
      {
        id: '1',
        name: 'Pothos',
        species: 'Epipremnum aureum',
        location: 'Sala',
        healthScore: 85,
      },
      {
        id: '2', 
        name: 'Monstera',
        species: 'Monstera deliciosa',
        location: 'Dormitorio',
        healthScore: 92,
      }
    ] as PlantSummary[],
    averageHealthScore: 88,
    commonIssues: [],
    careScheduleSummary: {
      needsWatering: ['1'],
      needsFertilizing: [],
      healthConcerns: [],
    },
    environmentalFactors: {
      locations: ['Sala', 'Dormitorio'],
      lightConditions: [],
      humidityNeeds: [],
    },
  };

  const mockSummary = {
    totalPlants: 3,
    averageHealth: 88,
    urgentActions: 1,
    healthyPlants: 2,
  };

  beforeEach(() => {
    cacheService = new GardenCacheService();
    vi.clearAllMocks();
  });

  describe('Garden Context Caching', () => {
    it('should cache and retrieve garden context', () => {
      // Should be null initially
      expect(cacheService.getGardenContext(userId)).toBeNull();

      // Set context
      cacheService.setGardenContext(userId, mockGardenContext);

      // Should retrieve cached context
      const cached = cacheService.getGardenContext(userId);
      expect(cached).toEqual(mockGardenContext);
      expect(cached?.totalPlants).toBe(3);
    });

    it('should expire garden context after timeout', async () => {
      // Mock short cache duration for testing
      const originalDuration = (cacheService as any).CACHE_DURATIONS.GARDEN_CONTEXT;
      (cacheService as any).CACHE_DURATIONS.GARDEN_CONTEXT = 50; // 50ms

      cacheService.setGardenContext(userId, mockGardenContext);
      
      // Should be cached initially
      expect(cacheService.getGardenContext(userId)).toEqual(mockGardenContext);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 60));

      // Should be expired
      expect(cacheService.getGardenContext(userId)).toBeNull();

      // Restore original duration
      (cacheService as any).CACHE_DURATIONS.GARDEN_CONTEXT = originalDuration;
    });
  });

  describe('Garden Summary Caching', () => {
    it('should cache and retrieve garden summary', () => {
      expect(cacheService.getGardenSummary(userId)).toBeNull();

      cacheService.setGardenSummary(userId, mockSummary);

      const cached = cacheService.getGardenSummary(userId);
      expect(cached).toEqual(mockSummary);
    });
  });

  describe('Suggested Questions Caching', () => {
    it('should cache and retrieve suggested questions', () => {
      const questions = [
        '¿Cómo está mi jardín?',
        '¿Qué plantas necesitan agua?',
        'Dame consejos',
      ];

      expect(cacheService.getSuggestedQuestions(userId)).toBeNull();

      cacheService.setSuggestedQuestions(userId, questions);

      const cached = cacheService.getSuggestedQuestions(userId);
      expect(cached).toEqual(questions);
    });
  });

  describe('Cache Invalidation', () => {
    beforeEach(() => {
      // Set up some cached data
      cacheService.setGardenContext(userId, mockGardenContext);
      cacheService.setGardenSummary(userId, mockSummary);
      cacheService.setSuggestedQuestions(userId, ['test']);
    });

    it('should invalidate specific cache types', () => {
      cacheService.invalidateCache(userId, ['garden_context', 'garden_summary']);

      expect(cacheService.getGardenContext(userId)).toBeNull();
      expect(cacheService.getGardenSummary(userId)).toBeNull();
      expect(cacheService.getSuggestedQuestions(userId)).not.toBeNull();
    });

    it('should invalidate all cache for user', () => {
      cacheService.invalidateCache(userId);

      expect(cacheService.getGardenContext(userId)).toBeNull();
      expect(cacheService.getGardenSummary(userId)).toBeNull();
      expect(cacheService.getSuggestedQuestions(userId)).toBeNull();
    });

    it('should invalidate on plant change', () => {
      cacheService.invalidateOnPlantChange(userId);

      // All plant-related cache should be invalidated
      expect(cacheService.getGardenContext(userId)).toBeNull();
      expect(cacheService.getGardenSummary(userId)).toBeNull();
      expect(cacheService.getSuggestedQuestions(userId)).toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    it('should provide accurate cache stats', () => {
      // Add some cache entries
      cacheService.setGardenContext(userId, mockGardenContext);
      cacheService.setGardenSummary(userId, mockSummary);

      const stats = cacheService.getCacheStats(userId);

      expect(stats.userEntries).toBe(2);
      expect(stats.validEntries).toBe(2);
      expect(stats.expiredEntries).toBe(0);
    });

    it('should detect expired entries in stats', async () => {
      // Mock short cache duration
      const originalDuration = (cacheService as any).CACHE_DURATIONS.GARDEN_SUMMARY;
      (cacheService as any).CACHE_DURATIONS.GARDEN_SUMMARY = 10; // 10ms

      cacheService.setGardenSummary(userId, mockSummary);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      const stats = cacheService.getCacheStats(userId);
      expect(stats.expiredEntries).toBe(1);
      expect(stats.validEntries).toBe(0);

      // Restore
      (cacheService as any).CACHE_DURATIONS.GARDEN_SUMMARY = originalDuration;
    });
  });

  describe('Cache Cleanup', () => {
    it('should clean up expired entries', async () => {
      // Mock short duration
      const originalDuration = (cacheService as any).CACHE_DURATIONS.GARDEN_CONTEXT;
      (cacheService as any).CACHE_DURATIONS.GARDEN_CONTEXT = 10;

      cacheService.setGardenContext(userId, mockGardenContext);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should have expired entry
      expect(cacheService.getCacheStats(userId).expiredEntries).toBe(1);

      // Cleanup
      cacheService.cleanup();

      // Should be cleaned up
      expect(cacheService.getCacheStats(userId).userEntries).toBe(0);

      // Restore
      (cacheService as any).CACHE_DURATIONS.GARDEN_CONTEXT = originalDuration;
    });

    it('should clear all cache', () => {
      cacheService.setGardenContext(userId, mockGardenContext);
      cacheService.setGardenSummary(userId, mockSummary);

      expect(cacheService.getCacheStats(userId).userEntries).toBe(2);

      cacheService.clearAll();

      expect(cacheService.getCacheStats(userId).userEntries).toBe(0);
    });
  });

  describe('Multi-user Cache Isolation', () => {
    it('should isolate cache between different users', () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      cacheService.setGardenContext(userId1, mockGardenContext);

      expect(cacheService.getGardenContext(userId1)).toEqual(mockGardenContext);
      expect(cacheService.getGardenContext(userId2)).toBeNull();

      // Invalidating user1 should not affect user2
      cacheService.setGardenContext(userId2, { ...mockGardenContext, totalPlants: 5 });
      cacheService.invalidateCache(userId1);

      expect(cacheService.getGardenContext(userId1)).toBeNull();
      expect(cacheService.getGardenContext(userId2)).not.toBeNull();
    });
  });
}); 