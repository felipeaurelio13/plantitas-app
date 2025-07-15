import { supabase } from '../lib/supabase';
import { 
  Plant, 
  AIAnalysisResponseSchema, 
  PlantResponseSchema,
  ProgressAnalysisResponseSchema,
  type AIAnalysisResponse, 
  type PlantResponse 
} from '../schemas';
import { parseError, logError } from '../lib/errorHandling';

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
  
  // Ensure all required fields have fallback values
  if (!transformed.species) {
    transformed.species = 'Unknown Plant';
  }
  if (!transformed.commonName) {
    transformed.commonName = 'Planta Desconocida';
  }
  if (!transformed.confidence) {
    transformed.confidence = 50;
  }
  
  if (transformed.health) {
    if (transformed.health.overallHealth) {
      transformed.health.overallHealth = translationMap[transformed.health.overallHealth] || transformed.health.overallHealth;
    } else {
      transformed.health.overallHealth = 'good';
    }
    if (transformed.health.growthStage) {
      transformed.health.growthStage = translationMap[transformed.health.growthStage] || transformed.health.growthStage;
    } else {
      transformed.health.growthStage = 'juvenile';
    }
    if (!transformed.health.moistureLevel) {
      transformed.health.moistureLevel = 50;
    }
    if (!transformed.health.confidence) {
      transformed.health.confidence = 70;
    }
    if (!transformed.health.issues) {
      transformed.health.issues = [];
    }
    if (!transformed.health.recommendations) {
      transformed.health.recommendations = ['Mantén un riego regular y observa el crecimiento de tu planta.'];
    }
  } else {
    // Provide default health data if missing
    transformed.health = {
      overallHealth: 'good',
      issues: [],
      recommendations: ['Mantén un riego regular y observa el crecimiento de tu planta.'],
      moistureLevel: 50,
      growthStage: 'juvenile',
      confidence: 70,
    };
  }

  if (transformed.careProfile) {
    if (transformed.careProfile.sunlightRequirement) {
      transformed.careProfile.sunlightRequirement = translationMap[transformed.careProfile.sunlightRequirement] || transformed.careProfile.sunlightRequirement;
    } else {
      transformed.careProfile.sunlightRequirement = 'medium';
    }
    if (transformed.careProfile.humidityPreference) {
      transformed.careProfile.humidityPreference = translationMap[transformed.careProfile.humidityPreference] || transformed.careProfile.humidityPreference;
    } else {
      transformed.careProfile.humidityPreference = 'medium';
    }
    if (!transformed.careProfile.wateringFrequency) {
      transformed.careProfile.wateringFrequency = 7;
    }
    if (!transformed.careProfile.fertilizingFrequency) {
      transformed.careProfile.fertilizingFrequency = 30;
    }
    if (!transformed.careProfile.temperatureRange) {
      transformed.careProfile.temperatureRange = { min: 18, max: 27 };
    }
    if (!transformed.careProfile.soilType) {
      transformed.careProfile.soilType = 'Suelo bien drenado';
    }
    if (!transformed.careProfile.specialCare) {
      transformed.careProfile.specialCare = [];
    }
  } else {
    // Provide default care profile if missing
    transformed.careProfile = {
      wateringFrequency: 7,
      sunlightRequirement: 'medium',
      humidityPreference: 'medium',
      temperatureRange: { min: 18, max: 27 },
      fertilizingFrequency: 30,
      soilType: 'Suelo bien drenado',
      specialCare: [],
    };
  }

  if (transformed.personality) {
    if (transformed.personality.communicationStyle) {
      transformed.personality.communicationStyle = translationMap[transformed.personality.communicationStyle] || transformed.personality.communicationStyle;
    } else {
      transformed.personality.communicationStyle = 'calm';
    }
    if (!transformed.personality.traits) {
      transformed.personality.traits = ['paciente', 'observador', 'agradecido'];
    }
    if (!transformed.personality.catchphrases) {
      transformed.personality.catchphrases = ['¡Gracias por cuidarme!', 'Me siento muy feliz contigo.'];
    }
    if (!transformed.personality.moodFactors) {
      transformed.personality.moodFactors = { health: 0.4, care: 0.4, attention: 0.2 };
    }
  } else {
    // Provide default personality if missing
    transformed.personality = {
      traits: ['paciente', 'observador', 'agradecido'],
      communicationStyle: 'calm',
      catchphrases: ['¡Gracias por cuidarme!', 'Me siento muy feliz contigo.'],
      moodFactors: { health: 0.4, care: 0.4, attention: 0.2 },
    };
  }

  return transformed;
};


export const analyzeImage = async (imageDataUrl: string): Promise<AIAnalysisResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-image', {
      body: { imageDataUrl },
    });

    if (error) {
      console.error('Error calling analyze-image function:', error);
      throw new Error('Error al conectar con el servicio de análisis. Por favor, verifica tu conexión a internet.');
    }

    // The 'data' object from a successful function invocation can still contain a business logic error.
    if (data && data.error) {
      console.error('Image analysis failed:', data.error);
      throw new Error(data.error); // Propagate the specific error message to the UI.
    }

    if (!data) {
      throw new Error('No se recibió respuesta del servicio de análisis. Por favor, inténtalo de nuevo.');
    }

    console.log('Raw data from analyze-image function:', JSON.stringify(data, null, 2));

    const transformedData = transformAIResponse(data);
    
    try {
      const validatedResponse = AIAnalysisResponseSchema.parse(transformedData);
      return validatedResponse;
    } catch (validationError) {
      console.error('Validation error in analyzeImage response:', validationError);
      console.error('Data that failed validation:', JSON.stringify(transformedData, null, 2));
      
      // Instead of throwing an error, try to create a valid response with the data we have
      const fallbackResponse: AIAnalysisResponse = {
        species: transformedData.species || 'Unknown Plant',
        commonName: transformedData.commonName || 'Planta Desconocida',
        variety: transformedData.variety || null,
        confidence: transformedData.confidence || 50,
        health: transformedData.health || {
          overallHealth: 'good',
          issues: [],
          recommendations: ['Mantén un riego regular y observa el crecimiento de tu planta.'],
          moistureLevel: 50,
          growthStage: 'juvenile',
          confidence: 70,
        },
        careProfile: transformedData.careProfile || {
          wateringFrequency: 7,
          sunlightRequirement: 'medium',
          humidityPreference: 'medium',
          temperatureRange: { min: 18, max: 27 },
          fertilizingFrequency: 30,
          soilType: 'Suelo bien drenado',
          specialCare: [],
        },
        personality: transformedData.personality || {
          traits: ['paciente', 'observador', 'agradecido'],
          communicationStyle: 'calm',
          catchphrases: ['¡Gracias por cuidarme!', 'Me siento muy feliz contigo.'],
          moodFactors: { health: 0.4, care: 0.4, attention: 0.2 },
        },
      };
      
      console.log('Using fallback response due to validation error:', fallbackResponse);
      return fallbackResponse;
    }
  } catch (error) {
    logError(error, 'analyzeImage');
    
    // Use the error handling utility to provide better error messages
    const errorInfo = parseError(error);
    throw new Error(errorInfo.userFriendlyMessage);
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