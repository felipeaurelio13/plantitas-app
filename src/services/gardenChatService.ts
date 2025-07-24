import { supabase } from '../lib/supabase';
import { gardenCacheService } from './gardenCacheService';
import {
  GardenAnalysisContext,
  GardenAIResponse,
  GardenChatMessage,
} from '../schemas';
import { toastService } from './toastService';

export class GardenChatService {
  private static instance: GardenChatService;

  static getInstance(): GardenChatService {
    if (!GardenChatService.instance) {
      GardenChatService.instance = new GardenChatService();
    }
    return GardenChatService.instance;
  }

  async sendMessage(message: string, sessionId: string, userId: string): Promise<GardenAIResponse> {
    try {
      // Obtener el JWT token del usuario autenticado
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.access_token) {
        console.error('User session not available:', authError);
        throw new Error('Usuario no autenticado. Por favor inicia sesión nuevamente.');
      }

      const { data, error } = await supabase.functions.invoke('garden-ai-chat', {
        body: { message, sessionId, userId },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(`Garden AI service error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data received from garden AI service');
      }

      return data;
    } catch (error) {
      console.error('Error in garden chat service:', error);
      throw error;
    }
  }

  async sendMessageToGardenAI(
    message: string, 
    userId: string, 
    conversationHistory: GardenChatMessage[]
  ): Promise<GardenAIResponse> {
    try {
      // Build garden context for the AI
      const gardenContext = await this.buildGardenContext(userId);
      
      // Convert conversation history to format expected by AI
      const formattedHistory = conversationHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Parámetro fijo de tono/persona
      const tonePersona = 'amigable, motivador, experto, cálido, y con un toque de humor ligero';

      // AUDITORÍA DE PROMPT (solo en desarrollo)
      if (import.meta.env.DEV) {
        console.log('[DEBUG][gardenChatService] Prompt enviado a garden-ai-chat:', {
          userMessage: message,
          gardenContext,
          conversationHistory: formattedHistory,
          tonePersona
        });
      }

      // Obtener el JWT token del usuario autenticado
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.access_token) {
        console.error('User session not available:', authError);
        throw new Error('Usuario no autenticado. Por favor inicia sesión nuevamente.');
      }

      const { data, error } = await supabase.functions.invoke('garden-ai-chat', {
        body: { 
          userMessage: message,
          gardenContext,
          conversationHistory: formattedHistory,
          tonePersona
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (import.meta.env.DEV) {
        console.log('[DEBUG][gardenChatService] Respuesta cruda de garden-ai-chat:', data);
      }

      if (error) {
        throw new Error(`Garden AI service error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data received from garden AI service');
      }

      // VALIDACIÓN DE CALIDAD DE RESPUESTA IA
      const aiResponse = typeof data === 'string' ? JSON.parse(data) : data;
      const lowerContent = (aiResponse.content || '').toLowerCase();
      const isGeneric =
        !aiResponse.content ||
        lowerContent.includes('no sé') ||
        lowerContent.includes('no tengo información') ||
        lowerContent.includes('no puedo ayudarte') ||
        lowerContent.length < 30;
      if (isGeneric) {
        toastService.warning('Respuesta genérica', 'La respuesta de la IA fue muy genérica o poco útil. Intenta preguntar de otra forma o proporciona más detalles.');
        if (import.meta.env.DEV) {
          console.warn('[QA][gardenChatService] Respuesta IA considerada genérica o pobre:', aiResponse.content);
        }
      }

      return {
        content: aiResponse.content || 'Lo siento, no pude procesar tu mensaje.',
        insights: aiResponse.insights || [],
        suggestedActions: aiResponse.suggestedActions || []
      };
    } catch (error) {
      console.error('Error sending message to garden AI:', error);
      throw error;
    }
  }

  async verifyFunctionAvailability(): Promise<{ available: boolean; error?: string }> {
    try {
      // Test with a proper payload structure
      const testPayload = {
        userMessage: 'ping',
        gardenContext: {
          totalPlants: 0,
          plantsData: [],
          averageHealthScore: 0,
          commonIssues: [],
          careScheduleSummary: {
            needsWatering: [],
            needsFertilizing: [],
            healthConcerns: []
          },
          environmentalFactors: {
            locations: ['test']
          }
        },
        conversationHistory: []
      };

      // Obtener el JWT token del usuario autenticado
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.access_token) {
        console.error('User session not available:', authError);
        throw new Error('Usuario no autenticado. Por favor inicia sesión nuevamente.');
      }

      const { data, error } = await supabase.functions.invoke('garden-ai-chat', {
        body: testPayload,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          return {
            available: false,
            error: 'La función de chat de jardín no está disponible en este momento'
          };
        }
        return {
          available: false,
          error: error.message
        };
      }

      // Verify the response has the expected structure
      if (data && typeof data.content === 'string') {
        return { available: true };
      }

      return { 
        available: false, 
        error: 'Function returned unexpected response format'
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  async getGardenHealthSummary(userId: string): Promise<{
    totalPlants: number;
    averageHealth: number;
    urgentActions: number;
    healthyPlants: number;
  }> {
    try {
      // Try to get from cache first
      const cachedSummary = gardenCacheService.getGardenSummary(userId);
      if (cachedSummary) {
        return cachedSummary;
      }

      const context = await this.buildGardenContext(userId);
      
      const healthyPlants = context.plantsData.filter(plant => plant.healthScore >= 80).length;
      const urgentActions = context.careScheduleSummary.needsWatering.length + 
                           context.careScheduleSummary.healthConcerns.length;

      const summary = {
        totalPlants: context.totalPlants,
        averageHealth: context.averageHealthScore,
        urgentActions,
        healthyPlants
      };

      // Cache the summary
      gardenCacheService.setGardenSummary(userId, summary);

      return summary;
    } catch (error) {
      console.error('Error getting garden health summary:', error);
      throw error;
    }
  }

  async getSuggestedQuestions(userId: string): Promise<string[]> {
    try {
      const context = await this.buildGardenContext(userId);
      const suggestions: string[] = [];

      if (context.totalPlants === 0) {
        suggestions.push('¿Cómo agrego mi primera planta?');
        suggestions.push('¿Qué tipo de planta me recomiendas para empezar?');
        return suggestions;
      }

      // Siempre relevante
      suggestions.push('¿Cuántas plantas tengo y cómo están?');
      suggestions.push('¿Cuál es la salud promedio de mi jardín?');

      // Si hay plantas con problemas de salud
      if (context.careScheduleSummary.healthConcerns.length > 0) {
        suggestions.push('¿Qué plantas necesitan atención especial?');
        suggestions.push('¿Qué problemas de salud hay en mi jardín?');
      }

      // Si hay plantas sanas destacadas
      if (context.plantsData.some(p => p.healthScore >= 80)) {
        suggestions.push('¿Cuáles de mis plantas están más sanas?');
      }

      // Si hay más de 1 ubicación
      if (context.environmentalFactors.locations.length > 1) {
        suggestions.push('¿Cómo afecta la ubicación a mis plantas?');
      }

      // Si hay más de 5 plantas
      if (context.totalPlants > 5) {
        suggestions.push('¿Cómo organizar mejor mi espacio de plantas?');
      }

      // Si hay fertilización registrada (solo si la propiedad existe en el objeto)
      if (context.plantsData.some(p => 'lastFertilized' in p && Boolean((p as any).lastFertilized))) {
        suggestions.push('¿Cuándo debo fertilizar mis plantas?');
      }

      // Si hay especies diferentes
      if (new Set(context.plantsData.map(p => p.species)).size > 1) {
        suggestions.push('¿Qué especie de planta es la más resistente en mi jardín?');
      }

      // Limita a máximo 6 sugerencias
      return suggestions.slice(0, 6);
    } catch (error) {
      console.error('Error getting suggested questions:', error);
      return [
        '¿Cuántas plantas tengo y cómo están?',
        '¿Cuál es la salud promedio de mi jardín?'
      ];
    }
  }

  async refreshGardenData(userId: string): Promise<void> {
    try {
      // Clear any cached data (if using cache service)
      this.invalidateCache(userId);
      
      // Force rebuild garden context to refresh data
      await this.buildGardenContext(userId);
      
      console.log('[GardenChatService] Garden data refreshed for user:', userId);
    } catch (error) {
      console.error('Error refreshing garden data:', error);
      throw error;
    }
  }

  async buildGardenContext(userId: string): Promise<GardenAnalysisContext> {
    try {
      // Try to get from cache first
      const cachedContext = gardenCacheService.getGardenContext(userId);
      if (cachedContext) {
        return cachedContext;
      }

      // Simplified version - fetch plants data
      const { data: dbPlants, error } = await supabase
        .from('plants')
        .select(`
          id,
          name,
          nickname,
          species,
          location,
          plant_environment,
          light_requirements,
          health_score,
          last_watered,
          last_fertilized,
          care_profile,
          date_added
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const plantsData = dbPlants.map(plant => ({
        id: plant.id,
        name: plant.name,
        nickname: plant.nickname || undefined,
        species: plant.species,
        location: plant.location,
        plantEnvironment: plant.plant_environment as 'interior' | 'exterior' | 'ambos' | undefined,
        lightRequirements: plant.light_requirements as 'poca_luz' | 'luz_indirecta' | 'luz_directa_parcial' | 'pleno_sol' | undefined,
        healthScore: plant.health_score || 85,
        lastWatered: plant.last_watered ? new Date(plant.last_watered) : undefined,
        wateringFrequency: (plant.care_profile as any)?.wateringFrequency,
      }));

      // Calculate garden analytics
      const totalPlants = plantsData.length;
      const averageHealthScore = totalPlants > 0 
        ? Math.round(plantsData.reduce((sum: number, plant: any) => sum + plant.healthScore, 0) / totalPlants)
        : 0;

      // Identify care needs
      const now = new Date();
      const needsWatering: string[] = [];
      const needsFertilizing: string[] = [];
      const healthConcerns: string[] = [];

      plantsData.forEach((plant: any) => {
        if (plant.lastWatered && plant.wateringFrequency) {
          const lastWateredDate = new Date(plant.lastWatered);
          const nextWateringDate = new Date(lastWateredDate);
          nextWateringDate.setDate(lastWateredDate.getDate() + plant.wateringFrequency);
          if (now > nextWateringDate) {
            needsWatering.push(plant.id);
          }
        }

        if (plant.healthScore < 70) {
          healthConcerns.push(plant.id);
        }
      });

      // Environment analysis
      const locations = [...new Set(plantsData.map((p: any) => p.location))];

      const context: GardenAnalysisContext = {
        totalPlants,
        plantsData,
        averageHealthScore,
        commonIssues: [],
        careScheduleSummary: {
          needsWatering,
          needsFertilizing,
          healthConcerns,
        },
        environmentalFactors: {
          locations: locations as string[],
          lightConditions: [],
          humidityNeeds: [],
        },
      };

      // Cache the context
      gardenCacheService.setGardenContext(userId, context);

      return context;
    } catch (error) {
      console.error('Error building garden context:', error);
      throw error;
    }
  }

  invalidateCache(userId: string): void {
    gardenCacheService.invalidateCache(userId);
    console.log('Cache invalidated for user:', userId);
  }
}

// Export singleton instance
export const gardenChatService = GardenChatService.getInstance(); 