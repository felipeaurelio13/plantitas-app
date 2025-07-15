import { supabase } from '../lib/supabase';
import type { AIAnalysisResponse } from '../schemas/ai-shared';
import type { PlantResponse, Plant } from '../schemas';

export const analyzeImage = async (imageDataUrl: string): Promise<AIAnalysisResponse> => {
  console.log('User authenticated with valid session, calling analyze-image function...');
  
  // Get current session for JWT token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('User must be authenticated to analyze images');
  }

  const { data, error } = await supabase.functions.invoke('analyze-image', {
    body: { imageDataUrl },
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    console.error('Error invoking analyze-image function:', error);
    
    // Handle specific error cases
    if (error.message?.includes('unsupported image')) {
      throw new Error('La imagen no es válida. Por favor, asegúrate de que sea una foto clara de una planta.');
    }
    
    if (error.message?.includes('OpenAI API key')) {
      throw new Error('Servicio de análisis temporalmente no disponible. Intenta de nuevo más tarde.');
    }
    
    const message = error.context?.msg ? JSON.parse(error.context.msg).error : error.message;
    throw new Error(`Failed to analyze image: ${message}`);
  }

  if (data && data.error) {
    console.error('Image analysis failed with a specific error:', data.error);
    throw new Error(data.error);
  }

  console.log('Image analysis completed successfully');
  return data as AIAnalysisResponse;
};

export const generatePlantResponse = async (
  plant: Plant,
  userMessage: string
): Promise<PlantResponse> => {
  console.log('[aiService] Invocando "generate-plant-response" con:', { plant, userMessage });
  
  // Obtener el JWT token del usuario autenticado
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session?.access_token) {
    console.error('User session not available:', authError);
    throw new Error('Usuario no autenticado. Por favor inicia sesión nuevamente.');
  }
  
  const { data, error } = await supabase.functions.invoke('generate-plant-response', {
    body: { plant, userMessage },
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    console.error('Error calling generate-plant-response function:', error);
    throw new Error('Failed to generate plant response: ' + error.message);
  }

  console.log('[aiService] Raw response from generate-plant-response:', data);
  return data as PlantResponse;
};

/**
 * Completa información faltante de una planta usando IA basándose en especies y nombre
 */
export const completeePlantInfo = async (
  species: string,
  commonName?: string
): Promise<{
  plantEnvironment: 'interior' | 'exterior' | 'ambos';
  lightRequirements: 'poca_luz' | 'luz_indirecta' | 'luz_directa_parcial' | 'pleno_sol';
  description?: string;
  funFacts?: string[];
}> => {
  console.log('🚀 [API] Iniciando llamada a complete-plant-info...');
  console.log('📡 [API] Parámetros enviados:', { species, commonName });
  
  // Obtener el JWT token del usuario autenticado
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session?.access_token) {
    console.error('User session not available:', authError);
    throw new Error('Usuario no autenticado. Por favor inicia sesión nuevamente.');
  }
  
  const { data, error } = await supabase.functions.invoke('complete-plant-info', {
    body: { species, commonName },
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    console.error('💥 [API] Error en complete-plant-info function:', error);
    throw new Error('Failed to complete plant info: ' + error.message);
  }

  console.log('🎯 [API] Respuesta recibida exitosamente:', data);

  // Validar que los datos recibidos sean correctos
  const validEnvironments = ['interior', 'exterior', 'ambos'] as const;
  const validLightRequirements = ['poca_luz', 'luz_indirecta', 'luz_directa_parcial', 'pleno_sol'] as const;

  const result = {
    plantEnvironment: validEnvironments.includes(data.plantEnvironment) ? data.plantEnvironment : 'interior',
    lightRequirements: validLightRequirements.includes(data.lightRequirements) ? data.lightRequirements : 'luz_indirecta',
    description: data.description || undefined,
    funFacts: Array.isArray(data.funFacts) ? data.funFacts : undefined,
  };

  return result;
};