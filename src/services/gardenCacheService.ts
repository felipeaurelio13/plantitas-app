import { GardenAnalysisContext, PlantSummary } from '../schemas';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface GardenCacheData {
  context: GardenAnalysisContext;
  summary: {
    totalPlants: number;
    averageHealth: number;
    urgentActions: number;
    healthyPlants: number;
  };
  suggestedQuestions: string[];
}

export class GardenCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  
  // Cache durations (in milliseconds)
  private readonly CACHE_DURATIONS = {
    GARDEN_CONTEXT: 5 * 60 * 1000,      // 5 minutes - Garden context data
    GARDEN_SUMMARY: 3 * 60 * 1000,      // 3 minutes - Health summary
    SUGGESTED_QUESTIONS: 10 * 60 * 1000, // 10 minutes - Suggested questions
    PLANT_DATA: 2 * 60 * 1000,          // 2 minutes - Individual plant data
  };

  /**
   * Generate cache key for user-specific data
   */
  private getCacheKey(userId: string, type: string): string {
    return `${userId}:${type}`;
  }

  /**
   * Check if cached data is still valid
   */
  private isValidCache<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
    if (!entry) return false;
    return Date.now() < entry.expiresAt;
  }

  /**
   * Get cached data if valid, otherwise return null
   */
  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (this.isValidCache(entry)) {
      if (import.meta.env.DEV) console.log(`[GardenCache] Cache HIT for key: ${key}`);
      return entry.data;
    }
    
    if (entry) {
      if (import.meta.env.DEV) console.log(`[GardenCache] Cache EXPIRED for key: ${key}`);
      this.cache.delete(key);
    } else {
      if (import.meta.env.DEV) console.log(`[GardenCache] Cache MISS for key: ${key}`);
    }
    
    return null;
  }

  /**
   * Store data in cache with expiration
   */
  private setCachedData<T>(key: string, data: T, duration: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
    };
    
    this.cache.set(key, entry);
    console.log(`[GardenCache] Cache SET for key: ${key}, expires in ${duration/1000}s`);
  }

  /**
   * Get cached garden context
   */
  getGardenContext(userId: string): GardenAnalysisContext | null {
    const key = this.getCacheKey(userId, 'garden_context');
    return this.getCachedData<GardenAnalysisContext>(key);
  }

  /**
   * Cache garden context
   */
  setGardenContext(userId: string, context: GardenAnalysisContext): void {
    const key = this.getCacheKey(userId, 'garden_context');
    this.setCachedData(key, context, this.CACHE_DURATIONS.GARDEN_CONTEXT);
  }

  /**
   * Get cached garden summary
   */
  getGardenSummary(userId: string): GardenCacheData['summary'] | null {
    const key = this.getCacheKey(userId, 'garden_summary');
    return this.getCachedData<GardenCacheData['summary']>(key);
  }

  /**
   * Cache garden summary
   */
  setGardenSummary(userId: string, summary: GardenCacheData['summary']): void {
    const key = this.getCacheKey(userId, 'garden_summary');
    this.setCachedData(key, summary, this.CACHE_DURATIONS.GARDEN_SUMMARY);
  }

  /**
   * Get cached suggested questions
   */
  getSuggestedQuestions(userId: string): string[] | null {
    const key = this.getCacheKey(userId, 'suggested_questions');
    return this.getCachedData<string[]>(key);
  }

  /**
   * Cache suggested questions
   */
  setSuggestedQuestions(userId: string, questions: string[]): void {
    const key = this.getCacheKey(userId, 'suggested_questions');
    this.setCachedData(key, questions, this.CACHE_DURATIONS.SUGGESTED_QUESTIONS);
  }

  /**
   * Get cached plant data
   */
  getPlantData(userId: string): PlantSummary[] | null {
    const key = this.getCacheKey(userId, 'plant_data');
    return this.getCachedData<PlantSummary[]>(key);
  }

  /**
   * Cache plant data
   */
  setPlantData(userId: string, plants: PlantSummary[]): void {
    const key = this.getCacheKey(userId, 'plant_data');
    this.setCachedData(key, plants, this.CACHE_DURATIONS.PLANT_DATA);
  }

  /**
   * Invalidate specific cache entries
   */
  invalidateCache(userId: string, types?: string[]): void {
    if (!types) {
      // Invalidate all cache for user
      const userKeys = Array.from(this.cache.keys()).filter(key => key.startsWith(`${userId}:`));
      userKeys.forEach(key => {
        this.cache.delete(key);
        console.log(`[GardenCache] Invalidated cache for key: ${key}`);
      });
    } else {
      // Invalidate specific types
      types.forEach(type => {
        const key = this.getCacheKey(userId, type);
        this.cache.delete(key);
        console.log(`[GardenCache] Invalidated cache for key: ${key}`);
      });
    }
  }

  /**
   * Invalidate cache when plants are modified
   */
  invalidateOnPlantChange(userId: string): void {
    console.log(`[GardenCache] Plant data changed, invalidating related caches`);
    this.invalidateCache(userId, [
      'garden_context',
      'garden_summary', 
      'plant_data',
      'suggested_questions'
    ]);
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(userId: string): {
    totalEntries: number;
    userEntries: number;
    validEntries: number;
    expiredEntries: number;
  } {
    const allKeys = Array.from(this.cache.keys());
    const userKeys = allKeys.filter(key => key.startsWith(`${userId}:`));
    
    let validEntries = 0;
    let expiredEntries = 0;
    
    userKeys.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        if (this.isValidCache(entry)) {
          validEntries++;
        } else {
          expiredEntries++;
        }
      }
    });

    return {
      totalEntries: allKeys.length,
      userEntries: userKeys.length,
      validEntries,
      expiredEntries,
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now >= entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });

    if (keysToDelete.length > 0) {
      console.log(`[GardenCache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Clear all cache (useful for logout or debugging)
   */
  clearAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    if (import.meta.env.DEV) console.log(`[GardenCache] Cleared all cache (${size} entries)`);
  }
}

// Export singleton instance
export const gardenCacheService = new GardenCacheService();

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    gardenCacheService.cleanup();
  }, 5 * 60 * 1000);
} 