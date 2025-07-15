import { supabase } from '../lib/supabase';
import { Plant, InsightResponseSchema, type Insight } from '../schemas';
import { z } from 'zod';

export const generateInsights = async (plant: Plant): Promise<Insight[]> => {
  try {
    console.log('[insightService] Generating insights for plant:', plant);
    const { data, error } = await supabase.functions.invoke('generate-plant-insights', {
      body: { plant },
    });

    console.log('[insightService] Raw response:', { data, error });

    if (error) {
      throw new Error(`Failed to generate insights: ${error.message}`);
    }

    const validatedData = InsightResponseSchema.parse(data);
    console.log('[insightService] Validated insights:', validatedData);
    return validatedData;

  } catch (error) {
    console.error('[insightService] Error generating insights:', error);
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid data structure for insights: ${error.message}`);
    }
    throw error;
  }
}; 