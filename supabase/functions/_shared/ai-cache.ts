// ============================================================================
// SISTEMA DE CACHÉ INTELIGENTE PARA RESPUESTAS IA
// ============================================================================

export interface CacheStrategy {
  keyGenerator: (input: any) => Promise<string>;
  ttl: number;
  invalidationRules: string[];
  compressionEnabled: boolean;
  cacheLevel: 'aggressive' | 'moderate' | 'conservative';
}

export interface CacheEntry {
  key: string;
  data: any;
  createdAt: string;
  expiresAt: string;
  accessCount: number;
  lastAccessed: string;
  operation: string;
  metadata: Record<string, any>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  cacheSize: number;
}

// ============================================================================
// CONFIGURACIONES DE CACHÉ POR OPERACIÓN
// ============================================================================

export const CACHE_STRATEGIES: Record<string, CacheStrategy> = {
  'image_analysis': {
    keyGenerator: generateImageAnalysisKey,
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 días
    invalidationRules: ['image_changed', 'model_updated'],
    compressionEnabled: true,
    cacheLevel: 'aggressive'
  },
  'plant_insights': {
    keyGenerator: generatePlantInsightsKey,
    ttl: 24 * 60 * 60 * 1000, // 1 día
    invalidationRules: ['plant_data_changed', 'health_updated'],
    compressionEnabled: true,
    cacheLevel: 'moderate'
  },
  'garden_analysis': {
    keyGenerator: generateGardenAnalysisKey,
    ttl: 6 * 60 * 60 * 1000, // 6 horas
    invalidationRules: ['garden_plants_changed', 'health_scores_updated'],
    compressionEnabled: true,
    cacheLevel: 'moderate'
  },
  'health_diagnosis': {
    keyGenerator: generateHealthDiagnosisKey,
    ttl: 3 * 24 * 60 * 60 * 1000, // 3 días
    invalidationRules: ['image_changed', 'plant_health_updated'],
    compressionEnabled: true,
    cacheLevel: 'conservative'
  },
  'chat_response': {
    keyGenerator: generateChatResponseKey,
    ttl: 30 * 60 * 1000, // 30 minutos
    invalidationRules: ['plant_personality_changed', 'context_updated'],
    compressionEnabled: false,
    cacheLevel: 'conservative'
  }
};

// ============================================================================
// GENERADORES DE LLAVES DE CACHÉ
// ============================================================================

async function generateImageAnalysisKey(input: any): Promise<string> {
  const { imageDataUrl, model = 'gpt-4o' } = input;
  
  // Crear hash del contenido de la imagen para detectar cambios
  const imageHash = await hashImageContent(imageDataUrl);
  return `img_analysis:${model}:${imageHash}`;
}

async function generatePlantInsightsKey(input: any): Promise<string> {
  const { plant, model = 'gpt-4o' } = input;
  
  // Incluir datos relevantes de la planta que afectan los insights
  const relevantData = {
    id: plant.id,
    healthScore: plant.healthScore,
    location: plant.location,
    careProfile: plant.careProfile,
    lastUpdated: plant.lastUpdated || new Date().toISOString()
  };
  
  const dataHash = await hashObject(relevantData);
  return `plant_insights:${model}:${dataHash}`;
}

async function generateGardenAnalysisKey(input: any): Promise<string> {
  const { userMessage, gardenContext, model = 'gpt-4o' } = input;
  
  // Normalizar el mensaje del usuario para mejorar cache hits
  const normalizedMessage = normalizeUserMessage(userMessage);
  
  // Incluir hash del contexto del jardín
  const contextHash = await hashObject({
    totalPlants: gardenContext.totalPlants,
    averageHealthScore: gardenContext.averageHealthScore,
    plantsData: gardenContext.plantsData?.map((p: any) => ({
      id: p.id,
      healthScore: p.healthScore,
      location: p.location
    }))
  });
  
  return `garden_analysis:${model}:${normalizedMessage}:${contextHash}`;
}

async function generateHealthDiagnosisKey(input: any): Promise<string> {
  const { imageUrl, plantName, species, model = 'gpt-4o' } = input;
  
  const imageHash = await hashImageContent(imageUrl);
  const plantHash = await hashObject({ plantName, species });
  
  return `health_diagnosis:${model}:${imageHash}:${plantHash}`;
}

async function generateChatResponseKey(input: any): Promise<string> {
  const { plant, userMessage, model = 'gpt-4o' } = input;
  
  const normalizedMessage = normalizeUserMessage(userMessage);
  
  // Para chat, incluir menos datos para permitir más reutilización
  const plantHash = await hashObject({
    id: plant.id,
    personality: plant.personality,
    mood: calculatePlantMood(plant) // Función que debería existir
  });
  
  return `chat_response:${model}:${normalizedMessage}:${plantHash}`;
}

// ============================================================================
// UTILIDADES DE HASH Y NORMALIZACIÓN
// ============================================================================

async function hashImageContent(imageDataOrUrl: string): Promise<string> {
  // Si es una URL, extraer el identificador único
  if (imageDataOrUrl.startsWith('http')) {
    return await hashString(imageDataOrUrl);
  }
  
  // Si es data URL, hacer hash del contenido
  const encoder = new TextEncoder();
  const data = encoder.encode(imageDataOrUrl);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashObject(obj: any): Promise<string> {
  const jsonString = JSON.stringify(obj, Object.keys(obj).sort());
  return hashString(jsonString);
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16); // Usar solo los primeros 16 caracteres
}

function normalizeUserMessage(message: string): string {
  return message
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remover puntuación
    .replace(/\s+/g, ' ') // Normalizar espacios
    .substring(0, 100); // Limitar longitud para mejores cache hits
}

// ============================================================================
// CLASE PRINCIPAL DE CACHÉ
// ============================================================================

export class AIResponseCache {
  private static instance: AIResponseCache;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalEntries: 0,
    cacheSize: 0
  };

  static getInstance(): AIResponseCache {
    if (!AIResponseCache.instance) {
      AIResponseCache.instance = new AIResponseCache();
    }
    return AIResponseCache.instance;
  }

  async get(operation: string, input: any): Promise<any | null> {
    try {
      const strategy = CACHE_STRATEGIES[operation];
      if (!strategy) {
        console.warn(`No cache strategy found for operation: ${operation}`);
        return null;
      }

      const key = await strategy.keyGenerator(input);
      
      // En un sistema real, esto consultaría la base de datos
      // Por ahora, simulamos con un Map en memoria (solo para desarrollo)
      const entry = await this.getCacheEntry(key);
      
      if (!entry) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      // Verificar si la entrada ha expirado
      if (new Date() > new Date(entry.expiresAt)) {
        await this.deleteCacheEntry(key);
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      // Actualizar estadísticas de acceso
      await this.updateAccessStats(key);
      this.stats.hits++;
      this.updateHitRate();

      console.log(`[Cache HIT] ${operation}:${key.substring(0, 20)}...`);
      
      return strategy.compressionEnabled ? 
        this.decompress(entry.data) : 
        entry.data;

    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(operation: string, input: any, data: any): Promise<void> {
    try {
      const strategy = CACHE_STRATEGIES[operation];
      if (!strategy) return;

      const key = await strategy.keyGenerator(input);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + strategy.ttl);

      const entry: CacheEntry = {
        key,
        data: strategy.compressionEnabled ? this.compress(data) : data,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        accessCount: 0,
        lastAccessed: now.toISOString(),
        operation,
        metadata: {
          compressionEnabled: strategy.compressionEnabled,
          cacheLevel: strategy.cacheLevel,
          inputHash: await hashObject(input)
        }
      };

      await this.setCacheEntry(entry);
      this.stats.totalEntries++;

      console.log(`[Cache SET] ${operation}:${key.substring(0, 20)}... (TTL: ${strategy.ttl / 1000}s)`);

    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidate(operation: string, rule: string, context: any = {}): Promise<number> {
    try {
      const strategy = CACHE_STRATEGIES[operation];
      if (!strategy || !strategy.invalidationRules.includes(rule)) {
        return 0;
      }

      // Implementar lógica de invalidación específica
      const deletedCount = await this.invalidateByRule(operation, rule, context);
      
      console.log(`[Cache INVALIDATE] ${operation}:${rule} - ${deletedCount} entries removed`);
      return deletedCount;

    } catch (error) {
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  async getStats(): Promise<CacheStats> {
    // Actualizar estadísticas desde la base de datos
    this.stats.totalEntries = await this.countCacheEntries();
    return { ...this.stats };
  }

  async cleanup(): Promise<number> {
    try {
      const now = new Date().toISOString();
      const deletedCount = await this.deleteExpiredEntries(now);
      
      console.log(`[Cache CLEANUP] Removed ${deletedCount} expired entries`);
      return deletedCount;

    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS (Simulados - en producción irían a Supabase)
  // ============================================================================

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private compress(data: any): string {
    // Implementación simple de compresión
    return JSON.stringify(data);
  }

  private decompress(compressedData: string): any {
    return JSON.parse(compressedData);
  }

  // TODO: Implementar con Supabase
  private async getCacheEntry(key: string): Promise<CacheEntry | null> {
    // Simulación - en producción sería:
    // const { data } = await supabase
    //   .from('ai_cache')
    //   .select('*')
    //   .eq('key', key)
    //   .single();
    // return data;
    return null;
  }

  private async setCacheEntry(entry: CacheEntry): Promise<void> {
    // Simulación - en producción sería:
    // await supabase
    //   .from('ai_cache')
    //   .upsert(entry);
  }

  private async deleteCacheEntry(key: string): Promise<void> {
    // Simulación
  }

  private async updateAccessStats(key: string): Promise<void> {
    // Simulación - en producción sería:
    // await supabase
    //   .from('ai_cache')
    //   .update({
    //     access_count: this.accessCount + 1,
    //     last_accessed: new Date().toISOString()
    //   })
    //   .eq('key', key);
  }

  private async invalidateByRule(operation: string, rule: string, context: any): Promise<number> {
    // Implementar lógica específica de invalidación
    return 0;
  }

  private async countCacheEntries(): Promise<number> {
    return 0;
  }

  private async deleteExpiredEntries(beforeDate: string): Promise<number> {
    return 0;
  }
}

// ============================================================================
// FUNCIONES DE UTILIDAD PARA USAR EN LAS EDGE FUNCTIONS
// ============================================================================

export async function getCachedResponse<T>(operation: string, input: any): Promise<T | null> {
  const cache = AIResponseCache.getInstance();
  return cache.get(operation, input);
}

export async function setCachedResponse(operation: string, input: any, response: any): Promise<void> {
  const cache = AIResponseCache.getInstance();
  await cache.set(operation, input, response);
}

export async function invalidateCache(operation: string, rule: string, context: any = {}): Promise<number> {
  const cache = AIResponseCache.getInstance();
  return cache.invalidate(operation, rule, context);
}

export async function getCacheStats(): Promise<CacheStats> {
  const cache = AIResponseCache.getInstance();
  return cache.getStats();
}

// ============================================================================
// FUNCIÓN HELPER PARA MOOD CALCULATION (referenciada arriba)
// ============================================================================

function calculatePlantMood(plant: any): string {
  // Esta función debería existir en el código original
  // Implementación simplificada para evitar errores
  const healthScore = plant.healthScore || 85;
  
  if (healthScore >= 90) return 'happy';
  if (healthScore >= 70) return 'content';
  if (healthScore >= 50) return 'neutral';
  if (healthScore >= 30) return 'worried';
  return 'sad';
} 