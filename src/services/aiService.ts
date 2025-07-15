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
  if (!data) return null;

  const translationMap: { [key: string]: string } = {
    // overallHealth
    'excelente': 'excellent',
    'bueno': 'good',
    'regular': 'fair',
    'malo': 'poor',
    // growthStage
    'semillero': 'seedling',
    'juvenil': 'juvenile',
    'madura': 'mature',
    'floración': 'flowering',
    'durmiente': 'dormant',
    // sunlightRequirement & humidityPreference
    'bajo': 'low',
    'medio': 'medium',
    'alta': 'high',
    // communicationStyle
    'alegre': 'cheerful',
    'sabio': 'wise',
    'dramático': 'dramatic',
    'calmado': 'calm',
    'juguetón': 'playful',
  };

  const transformed = { ...data };
  
  if (transformed.health) {
    if (transformed.health.overallHealth) {
      transformed.health.overallHealth = translationMap[transformed.health.overallHealth] || transformed.health.overallHealth;
    }
    if (transformed.health.growthStage) {
      transformed.health.growthStage = translationMap[transformed.health.growthStage] || transformed.health.growthStage;
    }
  }

  if (transformed.careProfile) {
    if (transformed.careProfile.sunlightRequirement) {
      transformed.careProfile.sunlightRequirement = translationMap[transformed.careProfile.sunlightRequirement] || transformed.careProfile.sunlightRequirement;
    }
    if (transformed.careProfile.humidityPreference) {
      transformed.careProfile.humidityPreference = translationMap[transformed.careProfile.humidityPreference] || transformed.careProfile.humidityPreference;
    }
  }

  if (transformed.personality) {
    if (transformed.personality.communicationStyle) {
      transformed.personality.communicationStyle = translationMap[transformed.personality.communicationStyle] || transformed.personality.communicationStyle;
    }
  }

  return transformed;
};


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

  const transformedData = transformAIResponse(data);
  try {
    const validatedResponse = AIAnalysisResponseSchema.parse(transformedData);
    return validatedResponse;
  } catch (validationError) {
    console.error('Validation error in analyzeImage response:', validationError);
    // For future debugging, let's log the data that failed validation.
    console.error('Data that failed validation:', JSON.stringify(transformedData, null, 2));
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