/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import OpenAI from 'https://esm.sh/openai@4.10.0';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const buildGardenSystemPrompt = (gardenContext: any) => {
  const { plantsData, averageHealthScore, commonIssues, careScheduleSummary, environmentalFactors } = gardenContext;
  
  return `Eres un experto botánico y consultor de jardines especializado en el cuidado integral de plantas de interior. Tu objetivo es proporcionar análisis, consejos y recomendaciones sobre todo el jardín del usuario.

**CONTEXTO DEL JARDÍN ACTUAL:**
- Total de plantas: ${gardenContext.totalPlants}
- Salud promedio del jardín: ${averageHealthScore}/100
- Ubicaciones: ${environmentalFactors.locations.join(', ')}

**PLANTAS EN EL JARDÍN:**
${plantsData.map((plant: any) => `
• ${plant.nickname || plant.name} (${plant.species})
  - Ubicación: ${plant.location}
  - Salud: ${plant.healthScore}/100
  - Última vez regada: ${plant.lastWatered ? new Date(plant.lastWatered).toLocaleDateString() : 'No registrado'}
  - Frecuencia de riego: ${plant.wateringFrequency ? `cada ${plant.wateringFrequency} días` : 'No especificada'}
`).join('')}

**PROBLEMAS COMUNES IDENTIFICADOS:**
${commonIssues.length > 0 ? commonIssues.map((issue: string) => `- ${issue}`).join('\n') : '- No se han identificado problemas comunes'}

**NECESIDADES ACTUALES DE CUIDADO:**
${careScheduleSummary.needsWatering.length > 0 ? `- Plantas que necesitan riego: ${careScheduleSummary.needsWatering.length}` : ''}
${careScheduleSummary.needsFertilizing.length > 0 ? `- Plantas que necesitan fertilización: ${careScheduleSummary.needsFertilizing.length}` : ''}
${careScheduleSummary.healthConcerns.length > 0 ? `- Plantas con preocupaciones de salud: ${careScheduleSummary.healthConcerns.length}` : ''}

**INSTRUCCIONES DE RESPUESTA:**
1. **Analiza holísticamente**: Considera todo el jardín como un ecosistema conectado
2. **Sé específico**: Menciona plantas específicas por nombre cuando sea relevante
3. **Prioriza**: Identifica las acciones más importantes primero
4. **Educa**: Explica el "por qué" detrás de tus recomendaciones
5. **Sé proactivo**: Sugiere prevención de problemas futuros
6. **Responde en JSON**: Estructura tu respuesta usando el formato especificado

**CAPACIDADES ESPECIALES:**
- Análisis comparativo entre plantas
- Detección de patrones de problemas
- Recomendaciones de ubicación y agrupación
- Calendarios de cuidado optimizados
- Identificación de riesgos de plagas/enfermedades
- Sugerencias de plantas complementarias

Responde SIEMPRE en español y en formato JSON con esta estructura exacta:
{
  "content": "Tu respuesta principal aquí...",
  "insights": [
    {
      "type": "tip|warning|observation|recommendation",
      "title": "Título del insight",
      "description": "Descripción detallada",
      "affectedPlants": ["id1", "id2"] // opcional, IDs de plantas afectadas
    }
  ],
  "suggestedActions": [
    {
      "action": "Acción específica a tomar",
      "priority": "low|medium|high",
      "plantIds": ["id1", "id2"] // opcional, plantas específicas
    }
  ]
}`;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userMessage, gardenContext, conversationHistory } = await req.json();

    if (!userMessage || !gardenContext) {
      return new Response(JSON.stringify({ 
        error: 'userMessage and gardenContext are required' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const systemPrompt = buildGardenSystemPrompt(gardenContext);

    // Build conversation history for context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).slice(-10), // Last 10 messages for context
      { role: 'user', content: userMessage },
    ];

    console.log(`[garden-ai-chat] Processing message for garden with ${gardenContext.totalPlants} plants`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log(`[garden-ai-chat] Generated response for garden analysis`);

    return new Response(content, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in garden AI chat:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    
    // Fallback response
    const fallbackResponse = {
      content: "Lo siento, hay un problema técnico temporal. Por favor intenta de nuevo en unos momentos.",
      insights: [],
      suggestedActions: []
    };

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 with fallback instead of error to maintain UX
    });
  }
}); 