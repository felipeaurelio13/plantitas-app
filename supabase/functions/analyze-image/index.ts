import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors';
import OpenAI from 'https://esm.sh/openai@4.10.0';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const PLANT_IDENTIFICATION_PROMPT = `Eres un botánico experto especializado en identificación de plantas domésticas. Analiza esta imagen y proporciona:

1. IDENTIFICACIÓN:
   - Especie exacta (nombre científico)
   - Nombre común en español
   - Variedad específica si es identificable
   - Nivel de confianza (0-100%)

2. ANÁLISIS DE SALUD:
   - Estado general: excelente/bueno/regular/malo
   - Problemas visibles (hojas amarillas, plagas, etc.)
   - Nivel de humedad aparente del suelo
   - Etapa de crecimiento

3. PERFIL DE CUIDADOS:
   - Frecuencia de riego (días)
   - Requerimientos de luz: bajo/medio/alto
   - Humedad preferida: baja/media/alta
   - Rango de temperatura ideal (°C)
   - Tipo de suelo recomendado
   - Frecuencia de fertilización (días)
   - Cuidados especiales (array de strings)

4. PERSONALIDAD SUGERIDA:
   - 3 rasgos de personalidad basados en la especie
   - Estilo de comunicación: alegre/sabio/dramático/calmado/juguetón
   - 2 frases características que usaría la planta en español

IMPORTANTE: Debes responder EXCLUSIVAMENTE en formato JSON válido. No agregues texto explicativo, disculpas, o comentarios. Si no puedes identificar una planta en la imagen (porque está borrosa, no es una planta, etc.), responde con este JSON exacto: { "error": "No se pudo identificar una planta en la imagen. Por favor, intenta con una foto más clara." }. De lo contrario, usa la siguiente estructura y asegúrate de que todos los valores numéricos sean números (no strings) y que los valores de las enumeraciones estén en INGLÉS:
{
  "species": "nombre científico",
  "commonName": "nombre común en español",
  "variety": "variedad específica o null",
  "confidence": 95,
  "health": {
    "overallHealth": "good",
    "issues": [{"type": "pest", "severity": "low", "description": "descripción", "treatment": "tratamiento"}],
    "recommendations": ["recomendación1", "recomendación2"],
    "moistureLevel": 60,
    "growthStage": "juvenile",
    "confidence": 90
  },
  "careProfile": {
    "wateringFrequency": 7,
    "sunlightRequirement": "medium",
    "humidityPreference": "medium",
    "temperatureRange": {"min": 18, "max": 27},
    "fertilizingFrequency": 30,
    "soilType": "descripción del suelo",
    "specialCare": ["cuidado1", "cuidado2"]
  },
  "personality": {
    "traits": ["rasgo1", "rasgo2", "rasgo3"],
    "communicationStyle": "calm",
    "catchphrases": ["frase1", "frase2"],
    "moodFactors": {"health": 0.4, "care": 0.4, "attention": 0.2}
  }
}
}`;

serve(async (req: Request) => {
  console.log(`[${new Date().toISOString()}] Function received a request. Method: ${req.method}`);

  if (req.method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] Handling OPTIONS request.`);
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`[${new Date().toISOString()}] Request is not OPTIONS, processing as POST.`);
    const { imageDataUrl } = await req.json();
    console.log(`[${new Date().toISOString()}] Parsed imageDataUrl from request body.`);

    if (!imageDataUrl) {
      console.error(`[${new Date().toISOString()}] imageDataUrl is required.`);
      return new Response(JSON.stringify({ error: 'imageDataUrl is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.log(`[${new Date().toISOString()}] OpenAI request timed out after 25 seconds.`);
      controller.abort();
    }, 25000); // 25 seconds

    console.log(`[${new Date().toISOString()}] Calling OpenAI API with a 25s timeout...`);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a botanical expert that analyzes plant images and returns results in JSON format.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: PLANT_IDENTIFICATION_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    }, { signal: controller.signal });
    
    clearTimeout(timeout);
    console.log(`[${new Date().toISOString()}] Received response from OpenAI.`);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error(`[${new Date().toISOString()}] No response content from OpenAI.`);
      throw new Error('No response from OpenAI');
    }

    try {
      console.log(`[${new Date().toISOString()}] Parsing OpenAI response content as JSON.`);
      const analysisData = JSON.parse(content);
      console.log(`[${new Date().toISOString()}] Successfully parsed JSON, sending response.`);
      return new Response(JSON.stringify(analysisData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (parseError) {
      console.error(`[${new Date().toISOString()}] Failed to parse JSON response from OpenAI.`, parseError);
      console.error(`[${new Date().toISOString()}] Raw content was:`, content);
      throw new Error('Invalid JSON response from OpenAI');
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[${new Date().toISOString()}] OpenAI request was aborted.`, error);
      return new Response(JSON.stringify({ error: 'The request to OpenAI timed out.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 504, // Gateway Timeout
      });
    }
    console.error(`[${new Date().toISOString()}] Caught an error in the main try block:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 