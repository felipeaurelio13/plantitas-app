import { supabase } from '../lib/supabase';
import { 
  Plant, 
  AIAnalysisResponseSchema, 
  PlantResponseSchema,
  ProgressAnalysisResponseSchema,
  type AIAnalysisResponse, 
  type PlantResponse 
} from '../schemas';

const transformAIResponse = (data: any): any => {
  if (!data || typeof data !== 'object') return data;

  const healthMap: Record<string, string> = { 'bueno': 'good', 'regular': 'fair', 'malo': 'poor', 'excelente': 'excellent' };
  const requirementMap: Record<string, string> = { 'bajo': 'low', 'medio': 'medium', 'alto': 'high' };
  const humidityMap: Record<string, string> = { 'baja': 'low', 'media': 'medium', 'alta': 'high' };
  const communicationMap: Record<string, string> = { 'alegre': 'cheerful', 'sabio': 'wise', 'dramático': 'dramatic', 'calmado': 'calm', 'juguetón': 'playful' };

  const transformed = JSON.parse(JSON.stringify(data));

  if (transformed.health?.overallHealth) {
    transformed.health.overallHealth = healthMap[transformed.health.overallHealth] ?? transformed.health.overallHealth;
  }
  if (transformed.careProfile?.sunlightRequirement) {
    transformed.careProfile.sunlightRequirement = requirementMap[transformed.careProfile.sunlightRequirement] ?? transformed.careProfile.sunlightRequirement;
  }
  if (transformed.careProfile?.humidityPreference) {
    transformed.careProfile.humidityPreference = humidityMap[transformed.careProfile.humidityPreference] ?? transformed.careProfile.humidityPreference;
  }
  if (transformed.careProfile?.wateringFrequency) {
    transformed.careProfile.wateringFrequency = Number(transformed.careProfile.wateringFrequency);
  }
  if (transformed.careProfile?.fertilizingFrequency) {
    transformed.careProfile.fertilizingFrequency = Number(transformed.careProfile.fertilizingFrequency);
  }
  if (transformed.careProfile?.temperatureRange?.min) {
    transformed.careProfile.temperatureRange.min = Number(transformed.careProfile.temperatureRange.min);
  }
  if (transformed.careProfile?.temperatureRange?.max) {
    transformed.careProfile.temperatureRange.max = Number(transformed.careProfile.temperatureRange.max);
  }
  if (transformed.personality?.communicationStyle) {
    transformed.personality.communicationStyle = communicationMap[transformed.personality.communicationStyle] ?? transformed.personality.communicationStyle;
  }

  return transformed;
}

export const analyzeImage = async (imageDataUrl: string): Promise<AIAnalysisResponse> => {
  const { data, error } = await supabase.functions.invoke('analyze-image', {
    body: { imageDataUrl },
  });

  if (error) {
    console.error('Error calling analyze-image function:', error);
    throw new Error('Failed to analyze image: ' + error.message);
  }

  // The 'data' object from a successful function invocation can still contain a business logic error.
  if (data && data.error) {
    console.error('Image analysis failed:', data.error);
    throw new Error(data.error); // Propagate the specific error message to the UI.
  }

  console.log('Raw data from analyze-image function:', JSON.stringify(data, null, 2));

  try {
    const transformedData = transformAIResponse(data);
    const validatedResponse = AIAnalysisResponseSchema.parse(transformedData);
    return validatedResponse;
  } catch (validationError) {
    console.error('Validation error in analyzeImage response:', validationError);
    // For future debugging, let's log the data that failed validation.
    console.error('Data that failed validation:', JSON.stringify(data, null, 2));
    throw new Error('Received invalid data from analysis function.');
  }
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