import { Plant } from '../schemas';

interface GardenAIResponse {
  content: string;
  insights?: {
    type: 'warning' | 'tip' | 'observation' | 'recommendation';
    title: string;
    description: string;
    affectedPlants?: string[];
  }[];
  suggestedActions?: {
    title: string;
    description: string;
    plantIds?: string[];
  }[];
}

class GardenChatService {
  async sendMessage(message: string, _sessionId: string, _userId: string): Promise<GardenAIResponse> {
    try {
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
        throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
      }

      // Get user's plants for context (this would come from Firebase)
      // For now, we'll pass minimal context
      const systemPrompt = `Eres un experto jardinero AI que ayuda a usuarios con el cuidado de sus plantas. 
      Responde de manera amigable, práctica y útil. 
      Proporciona consejos específicos cuando sea posible.
      Mantén las respuestas entre 100-200 palabras.
      Si el usuario pregunta algo específico sobre una planta, proporciona consejos detallados.`;

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
            { role: 'user', content: message }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      return {
        content,
        insights: [], // Could be populated with additional analysis
        suggestedActions: [] // Could be populated with actionable items
      };

    } catch (error) {
      console.error('[GARDEN CHAT] Error sending message:', error);
      throw error;
    }
  }

  async sendMessageToGardenAI(
    message: string, 
    gardenContext: { 
      plants: Plant[]; 
      sessionId?: string; 
      userId: string;
    }
  ): Promise<GardenAIResponse> {
    try {
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
        throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
      }

      const { plants, _userId } = gardenContext;

      // Prepare garden context
      const gardenSummary = {
        totalPlants: plants.length,
        averageHealth: plants.reduce((sum, p) => sum + (p.healthScore || 0), 0) / plants.length,
        species: [...new Set(plants.map(p => p.species))],
        locations: [...new Set(plants.map(p => p.location))],
        healthyPlants: plants.filter(p => (p.healthScore || 0) > 80).length,
        needsAttention: plants.filter(p => (p.healthScore || 0) < 60).length,
        plantSummaries: plants.map(p => ({
          name: p.name,
          species: p.species,
          health: p.healthScore,
          location: p.location
        }))
      };

      const systemPrompt = `Eres un experto jardinero AI especializado en el análisis de jardines completos. 
      
      Contexto del jardín del usuario:
      - Total de plantas: ${gardenSummary.totalPlants}
      - Salud promedio: ${gardenSummary.averageHealth.toFixed(1)}%
      - Especies: ${gardenSummary.species.join(', ')}
      - Ubicaciones: ${gardenSummary.locations.join(', ')}
      - Plantas saludables: ${gardenSummary.healthyPlants}
      - Necesitan atención: ${gardenSummary.needsAttention}
      
      Responde de manera personalizada considerando todo su jardín. 
      Proporciona consejos específicos y actionables.
      Si detectas problemas o oportunidades de mejora, menciónalos.
      Mantén las respuestas entre 150-250 palabras.`;

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
            { role: 'user', content: message }
          ],
          max_tokens: 400,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      // Generate insights based on garden context
      const insights = [];
      const suggestedActions = [];

      // Add insights for plants that need attention
      if (gardenSummary.needsAttention > 0) {
        insights.push({
          type: 'warning' as const,
          title: 'Plantas que necesitan atención',
          description: `Tienes ${gardenSummary.needsAttention} plantas con salud por debajo del 60%. Revisa su cuidado.`,
          affectedPlants: plants.filter(p => (p.healthScore || 0) < 60).map(p => p.id)
        });
      }

      // Add seasonal recommendations
      const currentMonth = new Date().getMonth() + 1;
      const currentSeason = currentMonth >= 3 && currentMonth <= 5 ? 'primavera' :
                           currentMonth >= 6 && currentMonth <= 8 ? 'verano' :
                           currentMonth >= 9 && currentMonth <= 11 ? 'otoño' : 'invierno';

      suggestedActions.push({
        title: `Cuidados de ${currentSeason}`,
        description: `Ajusta el riego y cuidados según la estación actual.`,
        plantIds: plants.map(p => p.id)
      });

      return {
        content,
        insights,
        suggestedActions
      };

    } catch (error) {
      console.error('[GARDEN CHAT] Error in sendMessageToGardenAI:', error);
      throw error;
    }
  }

  async generateHealthSummary(plants: Plant[]): Promise<{
    summary: string;
    recommendations: string[];
    alerts: string[];
  }> {
    try {
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
        return {
          summary: 'Configuración de OpenAI requerida para generar resumen de salud.',
          recommendations: ['Configura tu API key de OpenAI para obtener análisis detallados'],
          alerts: []
        };
      }

      const gardenData = {
        totalPlants: plants.length,
        averageHealth: plants.reduce((sum, p) => sum + (p.healthScore || 0), 0) / plants.length,
        healthDistribution: {
          excellent: plants.filter(p => (p.healthScore || 0) > 90).length,
          good: plants.filter(p => (p.healthScore || 0) > 70 && (p.healthScore || 0) <= 90).length,
          fair: plants.filter(p => (p.healthScore || 0) > 50 && (p.healthScore || 0) <= 70).length,
          poor: plants.filter(p => (p.healthScore || 0) <= 50).length
        },
        species: [...new Set(plants.map(p => p.species))],
        plantsNeedingAttention: plants.filter(p => (p.healthScore || 0) < 60)
      };

      const prompt = `Analiza la salud general de este jardín y proporciona un resumen en formato JSON:

      Datos del jardín:
      - Total de plantas: ${gardenData.totalPlants}
      - Salud promedio: ${gardenData.averageHealth.toFixed(1)}%
      - Distribución de salud:
        * Excelente (>90%): ${gardenData.healthDistribution.excellent}
        * Buena (70-90%): ${gardenData.healthDistribution.good}
        * Regular (50-70%): ${gardenData.healthDistribution.fair}
        * Pobre (<50%): ${gardenData.healthDistribution.poor}
      - Especies: ${gardenData.species.join(', ')}
      - Plantas que necesitan atención: ${gardenData.plantsNeedingAttention.length}

      Responde en formato JSON:
      {
        "summary": "Resumen general de la salud del jardín (2-3 oraciones)",
        "recommendations": ["Recomendación 1", "Recomendación 2", "Recomendación 3"],
        "alerts": ["Alerta 1 si es necesario", "Alerta 2 si es necesario"]
      }`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.6
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse health summary response:', content);
        return {
          summary: 'Error al generar resumen de salud del jardín.',
          recommendations: ['Intenta nuevamente más tarde'],
          alerts: []
        };
      }

    } catch (error) {
      console.error('[GARDEN CHAT] Error generating health summary:', error);
      return {
        summary: 'Error al generar resumen de salud del jardín.',
        recommendations: ['Verifica tu conexión e intenta nuevamente'],
        alerts: ['Error de conectividad']
      };
    }
  }

  async getGardenContext(_userId: string): Promise<{
    plants: Plant[];
    recentActivity: any[];
    overallHealth: number;
  }> {
    try {
      // This would typically fetch from Firebase
      // For now, return empty context
      console.warn('[GARDEN CHAT] getGardenContext not fully implemented - requires Firebase integration');
      
      return {
        plants: [],
        recentActivity: [],
        overallHealth: 0
      };

    } catch (error) {
      console.error('[GARDEN CHAT] Error getting garden context:', error);
      throw error;
    }
  }
}

export const gardenChatService = new GardenChatService();
export default gardenChatService; 