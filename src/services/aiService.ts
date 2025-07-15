import { supabase } from '../lib/supabase';
import {
  AIAnalysisResponseSchema,
  PlantResponseSchema,
  ProgressAnalysisResponseSchema,
  type AIAnalysisResponse,
  type PlantResponse,
  type Plant,
} from '../schemas';

const sanitizeData = (data: any): AIAnalysisResponse => {
  const safeData = data || {};
  const health = safeData.health || {};
  const careProfile = safeData.careProfile || {};
  const personality = safeData.personality || {};
  const tempRange = careProfile.temperatureRange || {};
  const moodFactors = personality.moodFactors || {};

  return {
    species: safeData.species || 'Especie no identificada',
    commonName: safeData.commonName || 'Planta desconocida',
    variety: safeData.variety || null,
    confidence: typeof safeData.confidence === 'number' ? safeData.confidence : 0,
    generalDescription: safeData.generalDescription || 'No se pudo generar una descripción.',
    funFacts: Array.isArray(safeData.funFacts) ? safeData.funFacts : [],
    health: {
      overallHealth: ['excellent', 'good', 'fair', 'poor'].includes(health.overallHealth) ? health.overallHealth : 'fair',
      issues: Array.isArray(health.issues) ? health.issues : [],
      recommendations: Array.isArray(health.recommendations) ? health.recommendations : [],
      moistureLevel: typeof health.moistureLevel === 'number' ? health.moistureLevel : 50,
      growthStage: ['seedling', 'juvenile', 'mature', 'flowering', 'dormant'].includes(health.growthStage) ? health.growthStage : 'mature',
      confidence: typeof health.confidence === 'number' ? health.confidence : 0,
    },
    careProfile: {
      wateringFrequency: typeof careProfile.wateringFrequency === 'number' ? careProfile.wateringFrequency : 7,
      sunlightRequirement: ['low', 'medium', 'high'].includes(careProfile.sunlightRequirement) ? careProfile.sunlightRequirement : 'medium',
      humidityPreference: ['low', 'medium', 'high'].includes(careProfile.humidityPreference) ? careProfile.humidityPreference : 'medium',
      temperatureRange: {
        min: typeof tempRange.min === 'number' ? tempRange.min : 18,
        max: typeof tempRange.max === 'number' ? tempRange.max : 25,
      },
      fertilizingFrequency: typeof careProfile.fertilizingFrequency === 'number' ? careProfile.fertilizingFrequency : 30,
      soilType: careProfile.soilType || 'Tierra para macetas estándar',
      specialCare: Array.isArray(careProfile.specialCare) ? careProfile.specialCare : [],
    },
    personality: {
      traits: Array.isArray(personality.traits) && personality.traits.length > 0 ? personality.traits : ['Misteriosa'],
      communicationStyle: ['cheerful', 'wise', 'dramatic', 'calm', 'playful'].includes(personality.communicationStyle) ? personality.communicationStyle : 'calm',
      catchphrases: Array.isArray(personality.catchphrases) ? personality.catchphrases : ['...'],
      moodFactors: {
        health: typeof moodFactors.health === 'number' ? moodFactors.health : 0.4,
        care: typeof moodFactors.care === 'number' ? moodFactors.care : 0.4,
        attention: typeof moodFactors.attention === 'number' ? moodFactors.attention : 0.2,
      },
    },
  };
};


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
  
  const sanitized = sanitizeData(data);

  const validationResult = AIAnalysisResponseSchema.safeParse(sanitized);

  if (!validationResult.success) {
    const flatError = validationResult.error.flatten();
    const errorDetails = JSON.stringify(flatError, null, 2);
    console.error('Client-side validation failed after sanitization:', errorDetails);
    throw new Error(`Received unexpected data structure from the analysis service. Details: ${errorDetails}`);
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