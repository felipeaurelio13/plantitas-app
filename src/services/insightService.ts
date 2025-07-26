import { Plant, InsightResponseSchema, type Insight } from '../schemas';
import { z } from 'zod';

export const generateInsights = async (plant: Plant): Promise<Insight[]> => {
  try {
    if (import.meta.env.DEV) console.log('[insightService] Generating insights for plant:', plant);
    
    // Supabase-specific authentication and function invocation removed
    // const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    // if (authError || !session?.access_token) {
    //   console.error('User session not available:', authError);
    //   throw new Error('Usuario no autenticado. Por favor inicia sesión nuevamente.');
    // }
    
    // const { data, error } = await supabase.functions.invoke('generate-plant-insights', {
    //   body: { plant },
    //   headers: {
    //     'Authorization': `Bearer ${session.access_token}`,
    //   },
    // });

    // For now, return a mock response or throw an error until Firebase Cloud Functions are integrated.
    // TODO: Replace with actual Firebase Cloud Function invocation for generate-plant-insights
    console.warn("Firebase Cloud Function invocation for generateInsights is not yet implemented.");
    const mockData = [
      { type: "watering", message: "Mock: Tu planta podría necesitar más agua." },
      { type: "light", message: "Mock: Considera mover tu planta a un lugar con más luz." },
    ];

    // if (import.meta.env.DEV) console.log('[insightService] Raw response:', { data, error });

    // if (error) {
    //   throw new Error(`Failed to generate insights: ${error.message}`);
    // }

    const validatedData = InsightResponseSchema.parse(mockData);
    if (import.meta.env.DEV) console.log('[insightService] Validated insights:', validatedData);
    return validatedData;

  } catch (error) {
    console.error('[insightService] Error generating insights:', error);
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid data structure for insights: ${error.message}`);
    }
    throw error;
  }
}; 