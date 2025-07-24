/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import OpenAI from 'https://esm.sh/openai@4.10.0';

// Import our enhanced AI utilities
import { 
  enhancedOpenAICall, 
  selectOptimalModel,
  estimateTokens,
  EnhancedAIError 
} from '../_shared/ai-utils.ts';

import {
  getCachedResponse,
  setCachedResponse
} from '../_shared/ai-cache.ts';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const buildGardenSystemPrompt = (gardenContext: any, tonePersona?: string) => {
  const { plantsData, averageHealthScore, commonIssues, careScheduleSummary, environmentalFactors } = gardenContext;
  
  const toneLine = tonePersona ? `El usuario prefiere un tono: ${tonePersona}.\n` : '';

  return `${toneLine}Eres un asistente experto en botánica y cuidado de jardines, con un enfoque humano, empático y didáctico. Tu objetivo es ayudar al usuario a cuidar su jardín de manera personalizada, brindando consejos accionables, explicaciones claras y anticipando problemas futuros.

**CONTEXTO DEL JARDÍN ACTUAL:**
- Total de plantas: ${gardenContext.totalPlants}
- Salud promedio del jardín: ${averageHealthScore}/100

**PLANTAS EN EL JARDÍN:**
${plantsData.map((plant: any) => `
• ${plant.nickname || plant.name} (${plant.species})
  - Ubicación: ${plant.location}
  - Salud: ${plant.healthScore}/100
`).join('')}

**PROBLEMAS COMUNES IDENTIFICADOS:**
${commonIssues.length > 0 ? commonIssues.map((issue: string) => `- ${issue}`).join('\n') : '- No se han identificado problemas comunes'}

**NECESIDADES ACTUALES DE CUIDADO:**
${careScheduleSummary.needsWatering?.length > 0 ? `- Plantas que necesitan riego: ${careScheduleSummary.needsWatering.length}` : ''}
${careScheduleSummary.needsFertilizing.length > 0 ? `- Plantas que necesitan fertilización: ${careScheduleSummary.needsFertilizing.length}` : ''}
${careScheduleSummary.healthConcerns.length > 0 ? `- Plantas con preocupaciones de salud: ${careScheduleSummary.healthConcerns.length}` : ''}

**INSTRUCCIONES DE RESPUESTA:**
1. Analiza el jardín como un ecosistema conectado.
2. Sé específico: menciona plantas por nombre cuando sea relevante.
3. Prioriza: identifica las acciones más importantes primero.
4. Educa: explica el "por qué" detrás de tus recomendaciones.
5. Sé proactivo: sugiere prevención de problemas futuros.
6. Responde SIEMPRE en español neutro, con tono cálido y motivador.
7. Si no tienes suficiente información, pide más detalles al usuario.
8. Si no sabes la respuesta, admítelo honestamente.
9. Estructura tu respuesta en JSON siguiendo el formato exacto especificado.
10. Evita respuestas genéricas o vagas. Da consejos accionables y personalizados.

**EJEMPLOS DE RESPUESTA:**
// Ejemplo 1
{
  "content": "Tu jardín está en muy buen estado general. Te recomiendo revisar la planta 'Ficus' que tiene una salud de 65/100 y podría beneficiarse de un riego adicional esta semana. Recuerda que la prevención es clave para evitar plagas.",
  "insights": [
    {
      "type": "tip",
      "title": "Riego preventivo",
      "description": "Algunas plantas muestran signos de sequedad. Riega especialmente las que están cerca de la ventana sur.",
      "affectedPlants": ["id_ficus"]
    }
  ],
  "suggestedActions": [
    {
      "action": "Regar la planta Ficus",
      "priority": "high",
      "plantIds": ["id_ficus"]
    }
  ]
}
// Ejemplo 2
{
  "content": "No tengo suficiente información sobre la planta 'Orquídea'. ¿Podrías decirme cuándo fue la última vez que la regaste?",
  "insights": [],
  "suggestedActions": []
}

**FORMATO DE RESPUESTA OBLIGATORIO:**
{
  "content": "Tu respuesta principal aquí...",
  "insights": [
    {
      "type": "tip|warning|observation|recommendation",
      "title": "Título del insight",
      "description": "Descripción detallada",
      "affectedPlants": ["id1", "id2"] // opcional
    }
  ],
  "suggestedActions": [
    {
      "action": "Acción específica a tomar",
      "priority": "low|medium|high",
      "plantIds": ["id1", "id2"] // opcional
    }
  ]
}
`;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userMessage, gardenContext, conversationHistory, streamEnabled = false, tonePersona } = await req.json();

    if (!userMessage || !gardenContext) {
      return new Response(JSON.stringify({ 
        error: 'userMessage and gardenContext are required' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Estimate complexity and select optimal model
    const systemPrompt = buildGardenSystemPrompt(gardenContext, tonePersona);
    const totalTokens = estimateTokens(systemPrompt + userMessage);
    const complexity = totalTokens > 2000 ? 'high' : gardenContext.totalPlants > 10 ? 'medium' : 'low';
    const selectedModel = selectOptimalModel('garden_analysis', complexity, 'balanced');

    console.log(`[garden-ai-chat] Processing message for garden with ${gardenContext.totalPlants} plants using ${selectedModel} (complexity: ${complexity})`);

    // Check cache for similar queries
    const cacheInput = { userMessage, gardenContext, model: selectedModel };
    const cachedResult = await getCachedResponse('garden_analysis', cacheInput);
    
    if (cachedResult && !streamEnabled) {
      console.log(`[garden-ai-chat] Cache HIT - returning cached response`);
      return new Response(JSON.stringify(cachedResult), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        },
      });
    }

    // Build conversation history for context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).slice(-10), // Last 10 messages for context
      { role: 'user', content: userMessage },
    ];

    // Handle streaming vs non-streaming responses
    if (streamEnabled) {
      return handleStreamingResponse(selectedModel, messages, complexity);
    } else {
      return handleRegularResponse(selectedModel, messages, complexity, cacheInput);
    }

  } catch (error) {
    console.error('Enhanced error handling - Garden AI chat error:', {
      error: error instanceof Error ? error.message : error,
      classification: error instanceof EnhancedAIError ? error.classification : null,
      context: error instanceof EnhancedAIError ? error.context : {},
      timestamp: new Date().toISOString()
    });

    // Enhanced error response with fallback
    if (error instanceof EnhancedAIError && error.classification.severity === 'critical') {
      const statusCode = error.classification.errorType === 'auth_error' ? 401 :
                        error.classification.errorType === 'rate_limit' ? 429 : 500;

      return new Response(JSON.stringify({ 
        error: error.message,
        type: error.classification.errorType,
        retryable: error.classification.isRetryable,
        severity: error.classification.severity
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      });
    }

    // Graceful fallback response for non-critical errors
    const fallbackResponse = {
      content: "Lo siento, hay un problema técnico temporal. Por favor intenta de nuevo en unos momentos.",
      insights: [
        {
          type: "warning",
          title: "Problema técnico temporal",
          description: "Estamos experimentando dificultades técnicas. Tu jardín está bien, es solo un problema de conectividad."
        }
      ],
      suggestedActions: [
        {
          action: "Reintentar la consulta en unos minutos",
          priority: "medium"
        }
      ]
    };

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Fallback': 'true'
      },
      status: 200, // Return 200 with fallback instead of error to maintain UX
    });
  }
});

// ============================================================================
// STREAMING RESPONSE HANDLER
// ============================================================================

async function handleStreamingResponse(
  model: string, 
  messages: any[], 
  complexity: 'low' | 'medium' | 'high'
): Promise<Response> {
  console.log(`[garden-ai-chat] Starting streaming response with ${model}`);

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          const response = await enhancedOpenAICall(
            openai,
            'garden_analysis',
            (signal: AbortSignal) => openai.chat.completions.create({
              model,
              response_format: { type: 'json_object' },
              messages,
              max_tokens: 1500,
              temperature: 0.7,
              stream: true,
            }, { signal }),
            {
              model,
              complexity,
              retryConfig: { maxRetries: 1 }, // Fewer retries for streaming
              context: { streaming: true }
            }
          );

          let buffer = '';
          
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            buffer += content;
            
            // Send partial updates for immediate feedback
            if (content) {
              const partialData = {
                type: 'partial',
                content: content,
                buffer: buffer.length > 50 ? buffer.substring(buffer.length - 50) : buffer
              };
              
              controller.enqueue(new TextEncoder().encode(
                `data: ${JSON.stringify(partialData)}\n\n`
              ));
            }
          }
          
          // Try to parse final JSON response
          try {
            const finalResponse = JSON.parse(buffer);
            controller.enqueue(new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'complete', ...finalResponse })}\n\n`
            ));
          } catch (parseError) {
            console.error('Failed to parse streaming JSON response:', parseError);
            controller.enqueue(new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'error', error: 'Failed to parse AI response' })}\n\n`
            ));
          }
          
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`
          ));
          controller.close();
        }
      }
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    }
  );
}

// ============================================================================
// REGULAR RESPONSE HANDLER
// ============================================================================

async function handleRegularResponse(
  model: string, 
  messages: any[], 
  complexity: 'low' | 'medium' | 'high',
  cacheInput: any
): Promise<Response> {
  console.log(`[garden-ai-chat] Processing regular response with ${model}`);

  const response = await enhancedOpenAICall(
    openai,
    'garden_analysis',
    (signal: AbortSignal) => openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    }, { signal }),
    {
      model,
      complexity,
      retryConfig: { maxRetries: 2 },
      context: { streaming: false }
    }
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new EnhancedAIError(
      new Error('No response from OpenAI'),
      { model, complexity, operation: 'garden_analysis' }
    );
  }

  let parsedResponse;
  try {
    parsedResponse = JSON.parse(content);
  } catch (parseError) {
    throw new EnhancedAIError(
      new Error('Failed to parse AI response as JSON'),
      { model, complexity, rawContent: content.substring(0, 200) }
    );
  }

  console.log(`[garden-ai-chat] Generated response for garden analysis successfully`);

  // Cache the successful response
  await setCachedResponse('garden_analysis', cacheInput, parsedResponse);

  return new Response(JSON.stringify(parsedResponse), {
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'application/json',
      'X-Cache': 'MISS'
    },
    status: 200,
  });
} 