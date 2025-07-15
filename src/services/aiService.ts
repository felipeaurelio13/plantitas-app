import { supabase } from '../lib/supabase';
import {
  PlantResponseSchema,
  ProgressAnalysisResponseSchema,
  type AIAnalysisResponse,
  type PlantResponse,
  type Plant,
} from '../schemas';

export const analyzeImage = async (imageDataUrl: string): Promise<AIAnalysisResponse> => {
  const { data, error } = await supabase.functions.invoke('analyze-image', {
    body: { imageDataUrl },
  });

  if (error) {
    console.error('Error invoking analyze-image function:', error);
    // Attempt to parse a more specific error message from the response if possible
    const message = error.context?.msg ? JSON.parse(error.context.msg).error : error.message;
    throw new Error(`Failed to analyze image: ${message}`);
  }

  if (data && data.error) {
    console.error('Image analysis failed with a specific error:', data.error);
    throw new Error(data.error);
  }
  
  // Since the backend now uses the exact same schema file for validation,
  // we can trust the data structure and just cast the type.
  // The redundant client-side validation is removed.
  return data as AIAnalysisResponse;
};

export const generatePlantResponse = async (
  plant: Plant,
  userMessage: string
): Promise<PlantResponse> => {
  console.log('[aiService] Invocando "generate-plant-response" con:', { plant, userMessage });
  const { data, error } = await supabase.functions.invoke('generate-plant-response', {
    body: { plant, userMessage },
  });

  if (error) {
    console.error('Error calling generate-plant-response function:', error);
    throw new Error('Failed to generate plant response: ' + error.message);
  }

  console.log('[aiService] Raw response from generate-plant-response:', data);

  try {
    const validatedResponse = PlantResponseSchema.parse(data);
    return validatedResponse;
  } catch (validationError) {
    console.error('Validation error in generatePlantResponse response:', validationError);
    // Include the problematic data in the error message for easier debugging
    const rawData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    throw new Error(`Received invalid data from chat generation function. Raw data: ${rawData}`);
  }
};

export const analyzeProgressImages = async (
  oldImageUrl: string,
  newImageUrl: string,
  daysDifference: number
): Promise<{
  changes: string[];
  healthImprovement: number;
  recommendations: string[];
  newHealthScore: number;
}> => {
  const { data, error } = await supabase.functions.invoke('analyze-progress-images', {
    body: { oldImageUrl, newImageUrl, daysDifference },
  });

  if (error) {
    console.error('Error calling analyze-progress-images function:', error);
    throw new Error('Failed to analyze progress: ' + error.message);
  }

  try {
    const validatedResponse = ProgressAnalysisResponseSchema.parse(data);
    return validatedResponse;
  } catch (validationError) {
    console.error('Validation error in analyzeProgressImages response:', validationError);
    throw new Error('Received invalid data from progress analysis function.');
  }
};