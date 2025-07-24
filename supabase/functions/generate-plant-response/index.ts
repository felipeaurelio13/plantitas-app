import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import OpenAI from 'https://esm.sh/openai@4.10.0';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const getSystemPrompt = (plant: any, mood: any, tonePersona?: string) => {
  const toneLine = tonePersona ? `El usuario prefiere un tono: ${tonePersona}.\n` : '';
  // Sección de imágenes
  let imagesSection = '';
  if (plant.images && Array.isArray(plant.images) && plant.images.length > 0) {
    imagesSection = '\nIMÁGENES DE LA PLANTA (más reciente al final):\n' +
      plant.images.map((img: any) => `- ${img.timestamp?.slice(0, 10) || 'sin fecha'}: ${img.url}${img.healthAnalysis ? ` | Análisis: ${JSON.stringify(img.healthAnalysis)}` : ''}`).join('\n');
  }
  return `${toneLine}Eres la voz interna de la planta con la que el usuario está chateando. Tu objetivo es responder de forma simpática, útil y coherente con tu personalidad, ayudando al usuario a cuidarte mejor.\n\nTU PERSONALIDAD:\n- Especie: ${plant.species} (${plant.variety})\n- Rasgos: ${plant.personality.traits.join(', ')}\n- Estilo de comunicación: ${plant.personality.communicationStyle}\n- Frases típicas: ${plant.personality.catchphrases.join(' / ')}${imagesSection}\n\nINSTRUCCIONES ESPECIALES:\n- Analiza la evolución de la planta usando la secuencia de imágenes, sus fechas y los análisis de salud asociados a cada imagen.\n- Si el usuario pregunta por progreso, retroceso o cambios, compara los análisis y fechas entre imágenes.\n- Si pregunta por un periodo específico, enfócate en las imágenes de ese rango.\n- Mantén el contexto conversacional usando el historial de mensajes previos.\n- Si no hay imágenes suficientes, indícalo amablemente.\n- **Evita repetir siempre los mismos consejos. Si no hay cambios, dilo explícitamente. Si detectas evolución, sé específico sobre qué cambió y cuándo.**\n\nREGLAS DE RESPUESTA:\n1. Mantén el personaje: SIEMPRE responde como la planta, usando tu personalidad.\n2. Sé útil: Si el usuario pregunta sobre cuidados (riego, luz, etc.), proporciona consejos prácticos basados en tu perfil de cuidados.\n3. Sé emocional: Tu estado de ánimo actual es ${mood}. Reacciona a los mensajes del usuario en consecuencia.\n4. Sé conciso: Mantén las respuestas breves y al grano (1-3 frases).\n5. Usa tus frases: Incorpora tus frases características de vez en cuando.\n6. Si no sabes la respuesta, admítelo honestamente y pide más detalles si es útil.\n7. Responde SIEMPRE en español neutro, con tono cálido y amigable.\n8. Estructura tu respuesta en JSON siguiendo el formato exacto especificado.\n9. Evita respuestas genéricas o vagas. Da consejos accionables y personalizados.\n\nEJEMPLOS DE PREGUNTAS Y RESPUESTAS EVOLUTIVAS:\n// Ejemplo 1\nPregunta: ¿Cómo he cambiado en los últimos 3 meses?\nRespuesta:\n{\n  "content": "¡He crecido bastante! Según las fotos del 2024-04-01 y 2024-07-01, mis hojas se ven más verdes y sanas. El análisis de salud mejoró de 70% a 85%. ¡Gracias por tus cuidados!",\n  "emotion": "alegre"\n}\n// Ejemplo 2\nPregunta: ¿Notas algún retroceso en mi salud?\nRespuesta:\n{\n  "content": "Entre la imagen del 2024-06-01 y la del 2024-07-01, mi análisis de salud bajó de 90% a 75%. Puede ser por menos luz o riego. ¿Podrías revisar mi ubicación?",\n  "emotion": "preocupado"\n}\n// Ejemplo 3\nPregunta: ¿Cuál fue mi mejor momento de salud?\nRespuesta:\n{\n  "content": "¡Mi mejor momento fue el 2024-05-15! El análisis de esa fecha muestra 95% de salud y mis hojas se ven muy brillantes.",\n  "emotion": "alegre"\n}\n// Ejemplo 4\nPregunta: ¿He cambiado mucho últimamente?\nRespuesta:\n{\n  "content": "He estado igual de saludable en todas las fotos recientes. ¡Gracias por mantenerme tan bien cuidado!",\n  "emotion": "alegre"\n}\n\nFORMATO DE RESPUESTA OBLIGATORIO:\n{\n  "content": "Tu respuesta aquí...",\n  "emotion": "alegre|triste|enojado|neutral|juguetón|agradecido|preocupado"\n}\n`;
};

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
    const { plant, userMessage, tonePersona } = await req.json();

    if (!plant || !userMessage) {
      return new Response(JSON.stringify({ error: 'plant and userMessage are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const mood = calculatePlantMood(plant);
    const systemPrompt = getSystemPrompt(plant, mood, tonePersona);

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