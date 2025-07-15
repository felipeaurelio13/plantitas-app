import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import OpenAI from 'https://esm.sh/openai@4.10.0';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const getProgressAnalysisPrompt = (daysDifference) => `Eres un botánico experto y analizas la progresión de una planta a lo largo del tiempo. Compara estas dos imágenes de la misma planta, tomadas con ${daysDifference} días de diferencia. La primera imagen es la más antigua.

Basado en la comparación, proporciona:
1.  **Cambios Observados**: Una lista de cambios clave (ej. "Nuevas hojas han brotado", "La planta ha crecido en altura", "Las hojas amarillentas han desaparecido").
2.  **Mejora de Salud**: Un número del -100 al 100 que cuantifique la mejora (positivo) o el empeoramiento (negativo) de la salud.
3.  **Recomendaciones Futuras**: Una lista de consejos de cuidado para mantener o mejorar la salud de la planta.
4.  **Nueva Puntuación de Salud**: Una nueva puntuación de salud general para la planta, del 0 al 100.

IMPORTANTE: Responde EXCLUSIVAMENTE en formato JSON válido.
{
  "changes": ["cambio1", "cambio2"],
  "healthImprovement": "número",
  "recommendations": ["recomendación1"],
  "newHealthScore": "número"
}`;


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { oldImageUrl, newImageUrl, daysDifference } = await req.json();

    if (!oldImageUrl || !newImageUrl || daysDifference === undefined) {
      return new Response(JSON.stringify({ error: 'oldImageUrl, newImageUrl, and daysDifference are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const prompt = getProgressAnalysisPrompt(daysDifference);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a botanical expert that analyzes plant progress images and returns results in JSON format.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: oldImageUrl, detail: 'high' } },
            { type: 'image_url', image_url: { url: newImageUrl, detail: 'high' } },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    const responseData = JSON.parse(content);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error analyzing progress images:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 