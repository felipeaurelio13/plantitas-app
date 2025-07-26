import type { AIAnalysisResponse } from '../schemas/ai-shared';
import type { PlantResponse, Plant } from '../schemas';
import { toastService } from './toastService';
import { generateInsights } from './insightService';

const analyzeImage = async (imageDataUrl: string): Promise<AIAnalysisResponse> => {
  if (import.meta.env.DEV) console.log('User authenticated with valid session, calling analyze-image function...');
  
  // ✅ Image size validation is now handled by PlantService.addPlantImage if needed
  // No direct validation here as this service primarily interfaces with AI functions
  
  // Supabase-specific authentication and function invocation removed
  // const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // if (sessionError || !session) {
  //   throw new Error('User must be authenticated to analyze images');
  // }

  // const { data, error } = await supabase.functions.invoke('analyze-image', {
  //   body: { imageDataUrl },
  //   headers: {
  //     'Authorization': `Bearer ${session.access_token}`,
  //   },
  // });

  // For now, return a mock response or throw an error until Firebase Cloud Functions are integrated.
  // TODO: Replace with actual Firebase Cloud Function invocation for analyze-image
  console.warn("Firebase Cloud Function invocation for analyzeImage is not yet implemented.");
  const mockData: AIAnalysisResponse = {
    plantName: "Mock Plant",
    species: "Mock Species",
    overallHealth: "good",
    issues: [],
    recommendations: [],
    careTips: [],
  };
  return mockData;
};

const generatePlantResponse = async (
  plant: Plant,
  userMessage: string
): Promise<PlantResponse & { insights?: any[]; suggestedActions?: any[] }> => {
  if (import.meta.env.DEV) {
    console.log('[DEBUG][aiService] Prompt enviado a generate-plant-response:', { plant, userMessage });
  }
  // Parámetro fijo de tono/persona
  const tonePersona = 'cálido, simpático, motivador, y con un toque de humor ligero';

  // Asegurar que las imágenes estén en el formato correcto y ordenadas, incluyendo healthAnalysis si existe
  const images = (plant.images || [])
    .map(img => ({
      url: img.url,
      timestamp: img.timestamp instanceof Date ? img.timestamp.toISOString() : img.timestamp,
      ...(img.healthAnalysis ? { healthAnalysis: img.healthAnalysis } : {})
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Obtener insights de la planta (tendencias, consejos, alertas)
  let insights: any[] = [];
  try {
    insights = await generateInsights(plant);
    if (import.meta.env.DEV) {
      console.log('[DEBUG][generatePlantResponse] Insights generados:', insights);
    }
  } catch (err) {
    console.warn('[generatePlantResponse] No se pudieron generar insights para la planta:', err);
    insights = [];
  }

  // Construir el objeto planta enriquecido
  const plantForPrompt = {
    ...plant,
    images
  };

  if (import.meta.env.DEV) {
    console.log('[DEBUG][generatePlantResponse] Imágenes enviadas a la IA:', images);
    console.log('[DEBUG][generatePlantResponse] Objeto plantForPrompt:', plantForPrompt);
  }

  // Supabase-specific authentication and function invocation removed
  // const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  // if (authError || !session?.access_token) {
  //   console.error('User session not available:', authError);
  //   throw new Error('Usuario no autenticado. Por favor inicia sesión nuevamente.');
  // }

  // const { data, error } = await supabase.functions.invoke('generate-plant-response', {
  //   body: {
  //     plant: plantForPrompt,
  //     userMessage,
  //     insights,
  //     tonePersona,
  //   },
  //   headers: {
  //     'Authorization': `Bearer ${session.access_token}`,
  //   },
  // });

  // For now, return a mock response or throw an error until Firebase Cloud Functions are integrated.
  // TODO: Replace with actual Firebase Cloud Function invocation for generate-plant-response
  console.warn("Firebase Cloud Function invocation for generatePlantResponse is not yet implemented.");
  const mockResponse: PlantResponse = {
    response: "Mock: Hola! Soy tu asistente de Plantitas. ¿En qué puedo ayudarte hoy con tu planta?",
  };
  return mockResponse;
};

const completePlantInfo = async (
  species: string,
  commonName?: string
): Promise<{
  plantEnvironment: 'interior' | 'exterior' | 'ambos';
  lightRequirements: 'poca_luz' | 'luz_indirecta' | 'luz_directa_parcial' | 'pleno_sol';
  description?: string;
  funFacts?: string[];
}> => {
  // Supabase-specific authentication and function invocation removed
  // const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  // if (authError || !session?.access_token) {
  //   console.error('User session not available:', authError);
  //   throw new Error('Usuario no autenticado. Por favor inicia sesión nuevamente.');
  // }

  // const { data, error } = await supabase.functions.invoke('complete-plant-info', {
  //   body: { species, commonName },
  //   headers: {
  //     'Authorization': `Bearer ${session.access_token}`,
  //   },
  // });

  // For now, return a mock response or throw an error until Firebase Cloud Functions are integrated.
  // TODO: Replace with actual Firebase Cloud Function invocation for complete-plant-info
  console.warn("Firebase Cloud Function invocation for completePlantInfo is not yet implemented.");
  const mockPlantInfo = {
    plantEnvironment: "interior",
    lightRequirements: "luz_indirecta",
    description: "Mock: Esta es una descripción de prueba para la planta.",
    funFacts: ["Mock: Dato curioso 1", "Mock: Dato curioso 2"],
  };
  return mockPlantInfo;
};

const updatePlantHealthDiagnosis = async (
  plant: Plant
): Promise<{
  healthScore: number;
  healthAnalysis: any;
  updatedImage: any;
}> => {
  // Supabase-specific authentication and function invocation removed
  // const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  // if (authError || !session?.access_token) {
  //   console.error('User session not available:', authError);
  //   throw new Error('Usuario no autenticado. Por favor inicia sesión nuevamente.');
  // }

  // const { data, error } = await supabase.functions.invoke('update-health-diagnosis', {
  //   body: { plant },
  //   headers: {
  //     'Authorization': `Bearer ${session.access_token}`,
  //   },
  // });

  // For now, return a mock response or throw an error until Firebase Cloud Functions are integrated.
  // TODO: Replace with actual Firebase Cloud Function invocation for update-health-diagnosis
  console.warn("Firebase Cloud Function invocation for updatePlantHealthDiagnosis is not yet implemented.");
  const mockHealthAnalysis = {
    healthScore: 85,
    healthAnalysis: { overallHealth: "good" },
    updatedImage: { id: "mock-image-id", url: "mock-image-url", healthAnalysis: { overallHealth: "good" } },
  };
  return mockHealthAnalysis;
};

// These are stubs, actual implementations will be done as part of the Firebase migration
const generatePlantInsights = () => { throw new Error('Not implemented'); };
const analyzeProgressImages = () => { throw new Error('Not implemented'); };
const updateHealthDiagnosis = () => { throw new Error('Not implemented'); };

const aiService = {
  analyzeImage,
  generatePlantResponse,
  completePlantInfo,
  updatePlantHealthDiagnosis,
  generatePlantInsights,
  analyzeProgressImages,
  updateHealthDiagnosis,
};

export default aiService;