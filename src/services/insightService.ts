import { supabase } from '../lib/supabase';
import { Plant } from '../schemas';

export const generateInsights = async (plant: Plant): Promise<string[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-plant-insights', {
      body: { plant },
    });

    if (error) {
      throw new Error(`Failed to generate insights: ${error.message}`);
    }

    if (!data.insights) {
      throw new Error('No insights returned from function.');
    }

    return data.insights;
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
}; 