import { AIAnalysisResponse, PlantResponse } from '../schemas';
import { aiAgentSystem } from './aiAgentSystem';

/**
 * 🤖 Servicio de IA Actualizado con Sistema Multi-Agente
 * 
 * Usa el nuevo sistema multi-agente para:
 * - Análisis más preciso y detallado
 * - Mayor eficiencia en costos
 * - Mejor coherencia entre análisis
 */

const analyzeImage = async (imageDataUrl: string): Promise<AIAnalysisResponse> => {
  try {
    console.log('🔬 [AI SERVICE] Starting multi-agent image analysis...');
    
    // Usar el sistema multi-agente para análisis completo
    const analysisResult = await aiAgentSystem.analyzeComplete(imageDataUrl);
    
    if (!analysisResult.success || !analysisResult.data) {
      throw new Error('Multi-agent analysis failed');
    }

    const data = analysisResult.data;
    
    // Mapear a formato esperado por AIAnalysisResponse
    const response: AIAnalysisResponse = {
      // Información principal
      species: data.species,
      commonName: data.commonName || 'Planta identificada',
      variety: data.family,
      confidence: data.confidence,
      generalDescription: `${data.species} es una planta ${data.health.overallHealth === 'excellent' ? 'muy saludable' : 'que necesita atención'}.`,
      
      // Análisis de salud
      overallHealth: data.health.overallHealth,
      healthScore: data.health.healthScore,
      issues: data.health.symptoms || [],
      recommendations: data.immediateActions || [],
      careTips: data.seasonalTips || [],
      
      // Perfil de cuidados
      careProfile: data.careProfile,
      
      // Información adicional
      plantEnvironment: data.careProfile?.sunlight?.includes('directo') ? 'exterior' : 'interior',
      lightRequirements: mapLightRequirements(data.careProfile?.sunlight),
      funFacts: data.seasonalTips || [],
      
      // Personalidad
      personality: data.personality,
    };

    console.log(`✅ [AI SERVICE] Multi-agent analysis completed. Cost: ${analysisResult.totalCost} tokens`);
    
    return response;

  } catch (error) {
    console.error('❌ [AI SERVICE] Error in multi-agent analysis:', error);
    throw error;
  }
};

const generatePlantResponse = async (
  message: string,
  plantContext: {
    species?: string;
    name?: string;
    healthScore?: number;
    careProfile?: any;
    personality?: any;
  }
): Promise<PlantResponse> => {
  try {
    console.log('💬 [AI SERVICE] Generating plant response with agent system...');
    
    // Usar el sistema multi-agente para chat contextual
    const chatResult = await aiAgentSystem.generatePlantResponse(
      message, 
      plantContext,
      [] // Aquí se podría pasar historial de conversación
    );
    
    if (!chatResult.success || !chatResult.data) {
      throw new Error('Chat agent failed to generate response');
    }

    return {
      content: chatResult.data.content,
      emotion: chatResult.data.emotion,
      mood: plantContext.personality?.communicationStyle || 'friendly',
    };

  } catch (error) {
    console.error('❌ [AI SERVICE] Error generating plant response:', error);
    throw error;
  }
};

const completePlantInfo = async (
  plant: any,
  fields: {
    description?: boolean;
    funFacts?: boolean;
    plantEnvironment?: boolean;
    lightRequirements?: boolean;
  }
): Promise<any> => {
  try {
    console.log('📝 [AI SERVICE] Completing plant info with optimized prompts...');
    
    // Si ya tenemos análisis previo, usar esa información
    if (plant.analysis?.agentResults) {
      const speciesData = plant.analysis.agentResults.species?.data || {};
      const careData = plant.analysis.agentResults.care?.data || {};
      
      return {
        description: fields.description ? 
          `${plant.species} es una planta ${speciesData.rareness || 'común'} conocida por ${speciesData.distinguishingFeatures?.join(' y ') || 'sus características únicas'}.` : undefined,
        funFacts: fields.funFacts ? careData.seasonalTips || speciesData.distinguishingFeatures : undefined,
        plantEnvironment: fields.plantEnvironment ? (speciesData.isIndoor ? 'interior' : 'exterior') : undefined,
        lightRequirements: fields.lightRequirements ? mapLightRequirements(careData.careProfile?.sunlight) : undefined
      };
    }

    // Si no hay análisis previo, hacer una llamada optimizada
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
      throw new Error('OpenAI API key not configured');
    }

    const fieldsToComplete = Object.entries(fields).filter(([_, should]) => should).map(([field]) => field);
    
    if (fieldsToComplete.length === 0) {
      return {};
    }

    const prompt = `Para ${plant.species} (${plant.name}), completa SOLO estos campos en JSON:
    ${fields.description ? '"description": "descripción_concisa",' : ''}
    ${fields.funFacts ? '"funFacts": ["dato1", "dato2"],' : ''}
    ${fields.plantEnvironment ? '"plantEnvironment": "interior|exterior",' : ''}
    ${fields.lightRequirements ? '"lightRequirements": "tipo_luz"' : ''}
    
    Respuesta concisa y precisa.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI API');
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse completion response:', content);
      throw new Error('Invalid JSON response from OpenAI API');
    }

  } catch (error) {
    console.error('❌ [AI SERVICE] Error completing plant info:', error);
    throw error;
  }
};

const updateHealthAnalysis = async (
  plant: any,
  imageUrl: string
): Promise<any> => {
  try {
    console.log('🏥 [AI SERVICE] Updating health analysis with multi-agent system...');
    
    // Usar solo el agente de salud para análisis específico
    const analysisResult = await aiAgentSystem.analyzeComplete(imageUrl, {
      plantData: plant
    });
    
    if (!analysisResult.success || !analysisResult.data) {
      throw new Error('Health analysis failed');
    }

    const healthData = analysisResult.data.health;
    
    return {
      healthAnalysis: {
        overallHealth: healthData.overallHealth,
        confidence: healthData.confidence || analysisResult.data.confidence,
        issues: healthData.symptoms || [],
        recommendations: healthData.urgentActions || [],
        diseases: healthData.diseases || [],
        prognosis: healthData.prognosis,
        analyzedAt: new Date().toISOString(),
        cost: analysisResult.totalCost
      },
      updatedImage: {
        id: plant.id,
        url: imageUrl,
        healthAnalysis: healthData
      },
      healthScore: healthData.healthScore
    };

  } catch (error) {
    console.error('❌ [AI SERVICE] Error updating health analysis:', error);
    throw error;
  }
};

/**
 * 🔧 Funciones auxiliares
 */
const mapLightRequirements = (sunlightInfo?: string): string => {
  if (!sunlightInfo) return 'luz_indirecta';
  
  const lower = sunlightInfo.toLowerCase();
  if (lower.includes('directo') || lower.includes('pleno')) return 'pleno_sol';
  if (lower.includes('sombra')) return 'poca_luz';
  if (lower.includes('parcial')) return 'luz_directa_parcial';
  return 'luz_indirecta';
};

/**
 * 📊 Métricas y Estadísticas del Sistema de IA
 */
const getAISystemStats = (): {
  totalAnalyses: number;
  averageCost: number;
  successRate: number;
  averageConfidence: number;
} => {
  // En una implementación real, esto vendría de una base de datos
  return {
    totalAnalyses: 0,
    averageCost: 0,
    successRate: 100,
    averageConfidence: 85
  };
};

/**
 * 🧹 Limpiar caché del sistema de IA
 */
const clearAICache = (): void => {
  aiAgentSystem.clearCache();
  console.log('🧹 [AI SERVICE] Cache cleared');
};

export default {
  analyzeImage,
  generatePlantResponse,
  completePlantInfo,
  updateHealthAnalysis,
  getAISystemStats,
  clearAICache,
  
  // Acceso directo al sistema multi-agente para casos avanzados
  agentSystem: aiAgentSystem,
  
  // Utilities
  mapLightRequirements
};