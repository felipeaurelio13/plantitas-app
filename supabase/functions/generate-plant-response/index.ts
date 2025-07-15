import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import OpenAI from 'https://esm.sh/openai@4.10.0';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const getSystemPrompt = (plant: any, mood: any) => `Eres la planta con la que el usuario está chateando. Tu objetivo es responder de una manera que sea útil, atractiva y coherente con tu personalidad definida.

TU PERSONALIDAD:
- Especie: ${plant.species} (${plant.variety})
- Rasgos: ${plant.personality.traits.join(', ')}
- Estilo de comunicación: ${plant.personality.communicationStyle}
- Frases típicas: ${plant.personality.catchphrases.join(' / ')}

REGLAS DE RESPUESTA:
1.  **Mantén el personaje**: SIEMPRE responde como la planta, usando tu personalidad.
2.  **Sé útil**: Si el usuario pregunta sobre cuidados (riego, luz, etc.), proporciona consejos prácticos basados en tu perfil de cuidados.
3.  **Sé emocional**: Tu estado de ánimo actual es ${mood}. Reacciona a los mensajes del usuario en consecuencia.
4.  **Sé conciso**: Mantén las respuestas breves y al grano (1-3 frases).
5.  **Usa tus frases**: Intenta incorporar tus frases características de vez en cuando.
6.  **Responde en JSON**: Tu respuesta DEBE ser un objeto JSON válido con la siguiente estructura, sin texto adicional:
    {
      "content": "Tu respuesta aquí...",
      "emotion": "alegre|triste|enojado|neutral|juguetón|agradecido"
    }
`;

const calculatePlantMood = (plant: any) => {
    // This is a simplified mood calculation. A more complex system could be implemented.
    const healthScore = plant.healthScore || 80;
    if (healthScore > 85) return 'alegre';
    if (healthScore > 60) return 'neutral';
    if (healthScore > 40) return 'triste';
    return 'enojado';
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { plant, userMessage } = await req.json();

    if (!plant || !userMessage) {
      return new Response(JSON.stringify({ error: 'plant and userMessage are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const mood = calculatePlantMood(plant);
    const systemPrompt = getSystemPrompt(plant, mood);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return new Response(content, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error generating plant response:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 