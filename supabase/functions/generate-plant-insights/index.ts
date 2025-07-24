/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import OpenAI from 'https://esm.sh/openai@4.10.0';
import { z } from 'https://esm.sh/zod@3.23.8';

// WORKAROUND: Schema is duplicated here to make the function self-contained.
const InsightSchema = z.object({
  type: z.enum(['info', 'warning', 'tip', 'alert']),
  title: z.string(),
  message: z.string(),
});
const InsightResponseSchema = z.array(InsightSchema);


const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const getInsightAgentPrompt = (plant: any) => `
You are an expert botanist and data analyst agent. Your mission is to provide actionable, data-driven insights about a houseplant.
Analyze the provided plant data and generate 3-5 key insights.

**CRITICAL JSON OUTPUT RULES:**
1.  **ONLY JSON**: Your response must be a single, valid JSON array. Do not include any text before or after it.
2.  **Strict Schema**: Each object in the array must conform to this structure: { "type": string, "title": string, "message": string }
3.  **Insight Types**: The "type" field MUST be one of: "info", "warning", "tip", "alert".
    - "alert": For critical issues needing immediate attention (e.g., severe health decline, pests).
    - "warning": For potential problems that are not yet critical.
    - "tip": For proactive advice and care improvements.
    - "info": For interesting observations or positive reinforcement.
4.  **Actionable & Data-Driven**: Every insight must be concise, easy to understand, and directly related to the provided data.

**Plant Data to Analyze:**
- Species: ${plant.species} (${plant.name})
- Health Score: ${plant.healthScore}/100
- Location: ${plant.location}
- Care Profile:
  - Watering: Every ${plant.careProfile.wateringFrequency} days
  - Sunlight: ${plant.careProfile.sunlightRequirement}
  - Humidity: ${plant.careProfile.humidityPreference}
- Recent Chat History: ${plant.chatHistory.slice(-3).map((m: any) => m.content).join('; ')}
- Latest Health Analysis: ${JSON.stringify(plant.images?.[0]?.healthAnalysis)}

Based on this data, generate the JSON array of insights.
`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { plant } = await req.json();

    // LOG: Entrada recibida
    console.log('[generate-plant-insights] Plant received:', JSON.stringify(plant, null, 2));

    if (!plant) {
      return new Response(JSON.stringify({ error: 'Plant data is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Robust prompt: proteger ante datos faltantes
    const safe = (v: any, fallback: any = 'N/A') => (v !== undefined && v !== null ? v : fallback);
    // Construir resumen de evolución de imágenes
    let evolutionBlock = '';
    if (Array.isArray(plant.images) && plant.images.length > 0) {
      evolutionBlock = '- Evolution Images:';
      plant.images.forEach((img: any) => {
        const date = img.timestamp ? new Date(img.timestamp).toISOString().split('T')[0] : 'unknown-date';
        evolutionBlock += `\n  - ${date}: ${JSON.stringify(img.healthAnalysis)}`;
      });
    } else {
      evolutionBlock = '- Evolution Images: N/A';
    }

    // Obtener fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const prompt = `
You are an expert botanist and data analyst agent. Your mission is to provide actionable, data-driven insights about a houseplant, using all available data and reasoning step by step. Today's date is: ${today}.

**Instructions:**
- For any analysis, you MUST use exactly the 'confidence' (as health percentage) and 'overallHealth' values from each image. Do NOT invent, estimate, or translate values. If a value is missing, say 'sin dato'.
- When reasoning, first list the raw data for each image: date, overallHealth, confidence. Then, compare the oldest and newest. Finally, summarize the trend in the title and message (in Spanish).
- If the user asks about the plant's evolution or percentage improvement, compare the oldest and most recent health scores and states, and calculate the percentage change. State the exact values, dates, and health states in the title and message. The final answer (title and message) MUST be in clear, natural Spanish, even if you reason in English.
- Always explain the likely causes for the change, using watering, sunlight, humidity, etc.
- If you cannot detect any evolution, say so explicitly, e.g., 'No se detectaron cambios significativos entre [fecha1] y [fecha2]'.
- If the user asks about care, diseases, or general information, use all available plant data and, if needed, supplement with up-to-date knowledge from the web or your training. If you would search online, say so and suggest a search phrase (in Spanish).
- Never use generic titles like 'Plant Evolution Analysis' or 'Health Improvement' without details.
- Output must be a single, valid JSON array. Do not include any text before or after it.
- Each object in the array must have: { "type": string, "title": string, "message": string }
- The "type" field MUST be one of: "info", "warning", "tip", "alert".

**Plant Data:**
- Species: ${safe(plant.species)} (${safe(plant.name)})
- Health Score: ${safe(plant.healthScore)}/100
- Location: ${safe(plant.location)}
- Care Profile:
  - Watering: Every ${safe(plant.careProfile?.wateringFrequency)} days
  - Sunlight: ${safe(plant.careProfile?.sunlightRequirement)}
  - Humidity: ${safe(plant.careProfile?.humidityPreference)}
- Recent Chat History: ${Array.isArray(plant.chatHistory) ? plant.chatHistory.slice(-3).map((m: any) => m.content).join('; ') : 'N/A'}
${evolutionBlock}

**EXAMPLE OUTPUT (evolution/percentage question):**
[
  {
    "type": "info",
    "title": "La salud mejoró de 'regular' (60%, 2025-07-15) a 'justa' (70%, 2025-07-24)",
    "message": "Datos crudos: 2025-07-15: overallHealth='regular', confidence=60. 2025-07-24: overallHealth='justa', confidence=70. Comparando ambos, la salud mejoró 10 puntos porcentuales. Esto probablemente se debe a un riego más frecuente y mayor exposición al sol. Para mejores prácticas, buscaría en la web: 'Canna indica cómo mejorar salud 2025'."
  }
]

**EXAMPLE OUTPUT (no significant change):**
[
  {
    "type": "info",
    "title": "No se detectaron cambios significativos entre 2025-07-15 y 2025-07-24",
    "message": "Datos crudos: 2025-07-15: overallHealth='buena', confidence=80. 2025-07-24: overallHealth='buena', confidence=80. La salud de la planta se mantuvo igual en ambas fechas, sin problemas importantes observados."
  }
]

**NEGATIVE EXAMPLE (do NOT do this):**
[
  {
    "type": "info",
    "title": "Plant Evolution Analysis",
    "message": "The plant is evolving."
  }
]

**EXAMPLE OUTPUT (care/disease/general question):**
[
  {
    "type": "tip",
    "title": "Consejo de fertilización",
    "message": "Pensando paso a paso: Según el perfil de cuidados y la temporada, fertiliza cada 30 días. Para recomendaciones actualizadas, buscaría en la web: 'Canna indica fertilización mejores prácticas 2025'."
  },
  {
    "type": "info",
    "title": "Prevención de enfermedades",
    "message": "Pensando paso a paso: La planta es susceptible a hongos en alta humedad. Asegura buena ventilación."
  }
]

Based on this data and the user's question, generate the JSON array of insights.
`;

    // LOG: Prompt generado
    console.log('[generate-plant-insights] Prompt sent to OpenAI:', prompt);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: "You are an expert botanist and data analyst agent that returns data in a structured JSON format." },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.6,
    });

    // LOG: Respuesta cruda de OpenAI
    console.log('[generate-plant-insights] Raw OpenAI response:', JSON.stringify(response, null, 2));

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response.');
    }

    // LOG: Contenido recibido de OpenAI
    console.log('[generate-plant-insights] Content from OpenAI:', content);

    // Extraer solo el array JSON de la respuesta
    let rawData;
    try {
      const arrayMatch = content.match(/\[.*\]/s);
      if (arrayMatch) {
        rawData = JSON.parse(arrayMatch[0]);
      } else {
        rawData = JSON.parse(content);
        if (!Array.isArray(rawData)) rawData = [rawData];
      }
    } catch (parseErr) {
      console.error('[generate-plant-insights] JSON parse error:', parseErr, 'Content:', content);
      throw new Error('No se pudo interpretar la respuesta de la IA. Intenta de nuevo o revisa el formato.');
    }

    const validationResult = InsightResponseSchema.safeParse(rawData);

    if (!validationResult.success) {
      console.error('Zod validation failed for insights.', validationResult.error.flatten());
      console.error('Raw Data Received:', JSON.stringify(rawData, null, 2));
      throw new Error('AI response for insights did not match the required structure.');
    }

    return new Response(JSON.stringify(validationResult.data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
