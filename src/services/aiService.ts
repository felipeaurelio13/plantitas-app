import { supabase } from '../lib/supabase';
import {
  AIAnalysisResponseSchema,
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
    const message = error.context?.msg ? JSON.parse(error.context.msg).error : error.message;
    throw new Error(`Failed to analyze image: ${message}`);
  }

  if (data && data.error) {
    console.error('Image analysis failed with a specific error:', data.error);
    throw new Error(data.error);
  }
  
  // The backend now validates the data, but we should parse it on the client
  // as well to ensure the data shape is what we expect and to get typed data.
  const validationResult = AIAnalysisResponseSchema.safeParse(data);

  if (!validationResult.success) {
    console.error('Client-side validation failed:', validationResult.error.flatten());
    throw new Error('Received unexpected data structure from the analysis service.');
  }

  return validationResult.data;
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