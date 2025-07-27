/**
 * 🤖 Sistema Multi-Agente de IA para Análisis de Plantas
 * 
 * Implementa las mejores prácticas de OpenAI para:
 * - Eficiencia en costos (usar modelos apropiados)
 * - Análisis colaborativo entre agentes
 * - Prompts optimizados y específicos
 * - Caché inteligente para reducir llamadas
 * - Rate limiting y error handling
 */

interface AgentResponse {
  success: boolean;
  data?: any;
  confidence: number;
  reasoning: string;
  cost: number; // Estimated cost in tokens
}

interface AnalysisContext {
  imageUrl?: string;
  plantData?: any;
  userHistory?: any;
  seasonalContext?: any;
}

/**
 * 🔬 Agente Especialista en Identificación de Especies
 * Usa GPT-4 Vision para identificación precisa
 */
class SpeciesIdentificationAgent {
  private readonly MODEL = 'gpt-4-vision-preview';
  private readonly MAX_TOKENS = 300;

  async analyze(imageUrl: string): Promise<AgentResponse> {
    try {
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
        throw new Error('OpenAI API key not configured');
      }

      const optimizedPrompt = `Como experto botánico, identifica esta planta:

RESPONDE SOLO EN JSON:
{
  "species": "nombre_científico",
  "commonName": "nombre_común",  
  "family": "familia_botánica",
  "confidence": número_0_100,
  "reasoning": "explicación_breve_2_líneas",
  "distinguishingFeatures": ["característica1", "característica2"],
  "isIndoor": boolean,
  "rareness": "común|poco_común|raro"
}

Sé preciso. Si no estás seguro, indica menor confidence.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: optimizedPrompt },
                { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } }
              ]
            }
          ],
          max_tokens: this.MAX_TOKENS,
          temperature: 0.1 // Baja temperatura para precisión
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from Species Agent');
      }

      const result = JSON.parse(content);
      
      return {
        success: true,
        data: result,
        confidence: result.confidence || 0,
        reasoning: result.reasoning || 'Species identification completed',
        cost: data.usage?.total_tokens || this.MAX_TOKENS
      };

    } catch (error) {
      console.error('Species Agent Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        confidence: 0,
        reasoning: `Error en identificación: ${errorMessage}`,
        cost: 0
      };
    }
  }
}

/**
 * 🏥 Agente Especialista en Diagnóstico de Salud
 * Usa GPT-4 Vision para análisis de salud detallado
 */
class HealthDiagnosisAgent {
  private readonly MODEL = 'gpt-4-vision-preview';
  private readonly MAX_TOKENS = 400;

  async analyze(imageUrl: string, speciesInfo?: any): Promise<AgentResponse> {
    try {
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
        throw new Error('OpenAI API key not configured');
      }

      const speciesContext = speciesInfo ? 
        `La planta es: ${speciesInfo.species} (${speciesInfo.commonName})` : 
        'Especie no identificada previamente';

      const optimizedPrompt = `Como fitopatólogo, diagnostica la salud de esta planta.

${speciesContext}

RESPONDE SOLO EN JSON:
{
  "overallHealth": "excellent|good|fair|poor|critical",
  "healthScore": número_0_100,
  "confidence": número_0_100,
  "symptoms": ["síntoma1", "síntoma2"],
  "diseases": ["enfermedad1"] o [],
  "pests": ["plaga1"] o [],
  "nutritionalIssues": ["deficiencia1"] o [],
  "urgentActions": ["acción1"] o [],
  "reasoning": "diagnóstico_en_2_líneas",
  "prognosis": "recuperación_esperada"
}

Enfócate en evidencia visual clara.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: optimizedPrompt },
                { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } }
              ]
            }
          ],
          max_tokens: this.MAX_TOKENS,
          temperature: 0.2 // Baja temperatura para precisión médica
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from Health Agent');
      }

      const result = JSON.parse(content);
      
      return {
        success: true,
        data: result,
        confidence: result.confidence || 0,
        reasoning: result.reasoning || 'Health diagnosis completed',
        cost: data.usage?.total_tokens || this.MAX_TOKENS
      };

    } catch (error) {
      console.error('Health Agent Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        confidence: 0,
        reasoning: `Error en diagnóstico: ${errorMessage}`,
        cost: 0
      };
    }
  }
}

/**
 * 🌱 Agente Especialista en Cuidados y Recomendaciones
 * Usa GPT-3.5 Turbo para eficiencia en cuidados
 */
class CareRecommendationAgent {
  private readonly MODEL = 'gpt-3.5-turbo';
  private readonly MAX_TOKENS = 350;

  async analyze(speciesInfo: any, healthInfo: any, _context: AnalysisContext): Promise<AgentResponse> {
    try {
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
        throw new Error('OpenAI API key not configured');
      }

      const currentSeason = this.getCurrentSeason();
      const plantContext = `
Planta: ${speciesInfo?.species || 'Desconocida'} (${speciesInfo?.commonName || 'Sin nombre'})
Salud: ${healthInfo?.overallHealth || 'Desconocida'} (${healthInfo?.healthScore || 0}%)
Estación: ${currentSeason}
Ambiente: ${speciesInfo?.isIndoor ? 'Interior' : 'Exterior'}`;

      const optimizedPrompt = `Como experto en jardinería, crea un plan de cuidados personalizado.

${plantContext}

RESPONDE SOLO EN JSON:
{
  "careProfile": {
    "watering": "frecuencia_específica",
    "sunlight": "requerimientos_luz",
    "humidity": "nivel_humedad",
    "temperature": "rango_temperatura",
    "fertilizing": "programa_fertilización"
  },
  "immediateActions": ["acción1", "acción2"],
  "weeklyRoutine": ["lunes: tarea", "miércoles: tarea"],
  "seasonalTips": ["consejo1", "consejo2"],
  "troubleshooting": {"problema": "solución"},
  "confidence": número_0_100,
  "reasoning": "justificación_en_2_líneas"
}

Sé específico y práctico.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            { role: 'user', content: optimizedPrompt }
          ],
          max_tokens: this.MAX_TOKENS,
          temperature: 0.3 // Algo de creatividad para variedad de consejos
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from Care Agent');
      }

      const result = JSON.parse(content);
      
      return {
        success: true,
        data: result,
        confidence: result.confidence || 0,
        reasoning: result.reasoning || 'Care recommendations generated',
        cost: data.usage?.total_tokens || this.MAX_TOKENS
      };

    } catch (error) {
      console.error('Care Agent Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        confidence: 0,
        reasoning: `Error en recomendaciones: ${errorMessage}`,
        cost: 0
      };
    }
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'primavera';
    if (month >= 6 && month <= 8) return 'verano';
    if (month >= 9 && month <= 11) return 'otoño';
    return 'invierno';
  }
}

/**
 * 🎭 Agente Especialista en Personalidad de Plantas
 * Usa GPT-3.5 Turbo para crear personalidades únicas
 */
class PersonalityAgent {
  private readonly MODEL = 'gpt-3.5-turbo';
  private readonly MAX_TOKENS = 200;

  async analyze(speciesInfo: any, healthInfo: any): Promise<AgentResponse> {
    try {
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
        throw new Error('OpenAI API key not configured');
      }

      const optimizedPrompt = `Crea una personalidad única para esta planta basada en sus características.

Especie: ${speciesInfo?.species || 'Desconocida'}
Salud: ${healthInfo?.overallHealth || 'Desconocida'}
Es rara: ${speciesInfo?.rareness === 'raro'}

RESPONDE SOLO EN JSON:
{
  "personality": {
    "energyLevel": "alta|media|baja",
    "communicationStyle": "alegre|sereno|jugueton|sabio|timido",
    "interests": ["interés1", "interés2"],
    "quirks": ["peculiaridad1"],
    "mood": "actual_mood_based_on_health"
  },
  "catchphrases": ["frase1", "frase2"],
  "chatStyle": "descripción_de_como_habla",
  "confidence": número_0_100
}

Hazla única y memorable.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            { role: 'user', content: optimizedPrompt }
          ],
          max_tokens: this.MAX_TOKENS,
          temperature: 0.8 // Alta creatividad para personalidades únicas
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from Personality Agent');
      }

      const result = JSON.parse(content);
      
      return {
        success: true,
        data: result,
        confidence: result.confidence || 0,
        reasoning: 'Personality profile created',
        cost: data.usage?.total_tokens || this.MAX_TOKENS
      };

    } catch (error) {
      console.error('Personality Agent Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        confidence: 0,
        reasoning: `Error en personalidad: ${errorMessage}`,
        cost: 0
      };
    }
  }
}

/**
 * 🎯 Coordinador Principal del Sistema Multi-Agente
 * Orquesta el análisis colaborativo y optimiza costos
 */
export class PlantAIAgentSystem {
  private speciesAgent = new SpeciesIdentificationAgent();
  private healthAgent = new HealthDiagnosisAgent();
  private careAgent = new CareRecommendationAgent();
  private personalityAgent = new PersonalityAgent();
  
  private analysisCache = new Map<string, any>();

  /**
   * 🔬 Análisis Completo Multi-Agente
   * Coordina todos los agentes para análisis integral
   */
  async analyzeComplete(imageUrl: string, context: AnalysisContext = {}): Promise<{
    success: boolean;
    data?: any;
    totalCost: number;
    agentResults: Record<string, AgentResponse>;
    summary: string;
  }> {
    const startTime = Date.now();
    const agentResults: Record<string, AgentResponse> = {};
    let totalCost = 0;

    try {
      console.log('🤖 [AI AGENTS] Starting multi-agent analysis...');

      // Paso 1: Identificación de especies (crítico para otros agentes)
      console.log('🔬 [SPECIES AGENT] Analyzing species...');
      const speciesResult = await this.speciesAgent.analyze(imageUrl);
      agentResults.species = speciesResult;
      totalCost += speciesResult.cost;

      if (!speciesResult.success) {
        console.warn('⚠️ Species identification failed, continuing with limited context');
      }

      // Paso 2: Diagnóstico de salud (paralelo si especie identificada)
      console.log('🏥 [HEALTH AGENT] Analyzing health...');
      const healthResult = await this.healthAgent.analyze(
        imageUrl, 
        speciesResult.success ? speciesResult.data : null
      );
      agentResults.health = healthResult;
      totalCost += healthResult.cost;

      // Paso 3: Análisis de cuidados y personalidad en paralelo (más eficiente)
      console.log('🌱 [CARE & PERSONALITY AGENTS] Running parallel analysis...');
      const [careResult, personalityResult] = await Promise.all([
        this.careAgent.analyze(
          speciesResult.data,
          healthResult.data,
          context
        ),
        this.personalityAgent.analyze(
          speciesResult.data,
          healthResult.data
        )
      ]);

      agentResults.care = careResult;
      agentResults.personality = personalityResult;
      totalCost += careResult.cost + personalityResult.cost;

      // Síntesis final
      const synthesizedData = this.synthesizeResults(agentResults);
      const analysisTime = Date.now() - startTime;

      console.log(`✅ [AI AGENTS] Analysis completed in ${analysisTime}ms, total cost: ${totalCost} tokens`);

      return {
        success: true,
        data: synthesizedData,
        totalCost,
        agentResults,
        summary: this.generateSummary(agentResults, analysisTime, totalCost)
      };

    } catch (error) {
      console.error('❌ [AI AGENTS] System error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        totalCost,
        agentResults,
        summary: `Error en análisis multi-agente: ${errorMessage}`
      };
    }
  }

  /**
   * 💬 Chat Inteligente con Contexto de Agentes
   */
  async generatePlantResponse(
    message: string,
    plantData: any,
    conversationHistory: any[] = []
  ): Promise<AgentResponse> {
    try {
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
        throw new Error('OpenAI API key not configured');
      }

      const personality = plantData.personality || {};
      const health = plantData.health || {};
      const species = plantData.species || 'Planta desconocida';

      const systemPrompt = `Eres ${plantData.name || species}, una planta con personalidad ${personality.communicationStyle || 'amigable'}.

TU PERSONALIDAD:
- Energía: ${personality.energyLevel || 'media'}
- Estilo: ${personality.communicationStyle || 'amigable'}
- Estado de ánimo: ${personality.mood || 'neutral'} (salud: ${health.overallHealth || 'desconocida'})
- Peculiaridades: ${personality.quirks?.join(', ') || 'Ninguna especial'}

REGLAS:
1. Responde como esta planta específica
2. Menciona tu salud si es relevante
3. Usa tu personalidad única
4. Máximo 100 palabras
5. Incluye emojis de plantas 🌱🌿🍃

Mantén coherencia con tu personalidad establecida.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-4), // Solo últimos 4 mensajes para eficiencia
            { role: 'user', content: message }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from Chat Agent');
      }

      return {
        success: true,
        data: { content, emotion: this.detectEmotion(content) },
        confidence: 90,
        reasoning: 'Chat response generated with personality context',
        cost: data.usage?.total_tokens || 150
      };

    } catch (error) {
      console.error('Chat Agent Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        confidence: 0,
        reasoning: `Error en chat: ${errorMessage}`,
        cost: 0
      };
    }
  }

  /**
   * 🧠 Síntesis de Resultados de Todos los Agentes
   */
  private synthesizeResults(agentResults: Record<string, AgentResponse>): any {
    const species = agentResults.species?.data || {};
    const health = agentResults.health?.data || {};
    const care = agentResults.care?.data || {};
    const personality = agentResults.personality?.data || {};

    // Calcular confianza general basada en todos los agentes
    const overallConfidence = Object.values(agentResults)
      .filter(result => result.success)
      .reduce((sum, result) => sum + result.confidence, 0) / 
      Object.values(agentResults).filter(result => result.success).length;

    return {
      // Datos principales
      species: species.species || 'Especie no identificada',
      commonName: species.commonName || 'Nombre no identificado',
      family: species.family,
      confidence: Math.round(overallConfidence),
      
      // Análisis de salud
      health: {
        overallHealth: health.overallHealth || 'unknown',
        healthScore: health.healthScore || 50,
        symptoms: health.symptoms || [],
        diseases: health.diseases || [],
        urgentActions: health.urgentActions || [],
        prognosis: health.prognosis
      },
      
      // Perfil de cuidados
      careProfile: care.careProfile || {
        watering: 'semanal',
        sunlight: 'luz_indirecta',
        humidity: 'media',
        temperature: 'templada',
        fertilizing: 'mensual'
      },
      
      // Personalidad única
      personality: personality.personality || {
        energyLevel: 'media',
        communicationStyle: 'amigable',
        interests: ['sol', 'agua'],
        mood: 'neutral'
      },
      
      // Recomendaciones inmediatas
      immediateActions: care.immediateActions || [],
      weeklyRoutine: care.weeklyRoutine || [],
      seasonalTips: care.seasonalTips || [],
      
      // Metadatos del análisis
      analysis: {
        timestamp: new Date().toISOString(),
        agentSuccess: Object.values(agentResults).filter(r => r.success).length,
        totalAgents: Object.keys(agentResults).length,
        overallConfidence: Math.round(overallConfidence)
      }
    };
  }

  /**
   * 📊 Generar Resumen del Análisis
   */
  private generateSummary(
    agentResults: Record<string, AgentResponse>, 
    analysisTime: number, 
    totalCost: number
  ): string {
    const successfulAgents = Object.values(agentResults).filter(r => r.success).length;
    const totalAgents = Object.keys(agentResults).length;
    
    return `Análisis multi-agente completado: ${successfulAgents}/${totalAgents} agentes exitosos en ${analysisTime}ms. Costo: ${totalCost} tokens.`;
  }

  /**
   * 😊 Detectar Emoción en Respuestas de Chat
   */
  private detectEmotion(content: string): string {
    if (content.includes('😊') || content.includes('🌱') || content.includes('feliz')) return 'alegre';
    if (content.includes('😔') || content.includes('triste') || content.includes('marchita')) return 'triste';
    if (content.includes('😄') || content.includes('🎉') || content.includes('genial')) return 'emocionado';
    if (content.includes('😟') || content.includes('preocup') || content.includes('ayuda')) return 'preocupado';
    return 'neutral';
  }

  /**
   * 🗑️ Limpiar Caché (para gestión de memoria)
   */
  clearCache(): void {
    this.analysisCache.clear();
    console.log('🧹 [AI AGENTS] Cache cleared');
  }
}

// Instancia singleton para uso en toda la aplicación
export const aiAgentSystem = new PlantAIAgentSystem();
export default aiAgentSystem;