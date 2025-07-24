import { supabase } from '../lib/supabase';
import { Plant, InsightResponseSchema, type Insight } from '../schemas';
import { z } from 'zod';

export const generateInsights = async (plant: Plant): Promise<Insight[]> => {
  try {
    if (import.meta.env.DEV) console.log('[insightService] Generating insights for plant:', plant);
    
    // Obtener el JWT token del usuario autenticado
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.access_token) {
      console.error('User session not available:', authError);
      throw new Error('Usuario no autenticado. Por favor inicia sesión nuevamente.');
    }
    
    const { data, error } = await supabase.functions.invoke('generate-plant-insights', {
      body: { plant },
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (import.meta.env.DEV) console.log('[insightService] Raw response:', { data, error });

    if (error) {
      throw new Error(`Failed to generate insights: ${error.message}`);
    }

    const validatedData = InsightResponseSchema.parse(data);
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