/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import OpenAI from 'https://esm.sh/openai@4.10.0';

const SYSTEM_PROMPT = `You are an expert botanist. Your goal is to provide accurate information about a plant species to complete missing data fields.

**CRITICAL INSTRUCTIONS:**
1. **COMPLETE RESPONSE**: You MUST provide plantEnvironment and lightRequirements for every request.
2. **ACCURACY**: Provide the most accurate information possible based on the plant species.
3. **LANGUAGE**: Description and fun facts MUST be in SPANISH.
4. **PLANT ENVIRONMENT**: Determine if this plant species is best suited for:
   - 'interior' (indoor houseplant)
   - 'exterior' (outdoor garden plant) 
   - 'ambos' (can thrive in both environments)
5. **LIGHT REQUIREMENTS**: Specify light needs as:
   - 'poca_luz' (low light, shade-tolerant)
   - 'luz_indirecta' (bright indirect light)
   - 'luz_directa_parcial' (partial direct sunlight)
   - 'pleno_sol' (full sun requirements)
6. **OPTIONAL FIELDS**: If requested, provide a description (minimum 50 words) and exactly 5 fun facts in Spanish.
`;

serve(async (req: Request) => {
  const requestTimestamp = new Date().toISOString();
  console.log(`[${requestTimestamp}] Complete-plant-info function received a request. Method: ${req.method}`);

  if (req.method === 'OPTIONS') {
    console.log(`[${requestTimestamp}] Handling OPTIONS request.`);
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`[${requestTimestamp}] Processing POST request.`);
    const { species, commonName } = await req.json();

    if (!species) {
      console.error(`[${requestTimestamp}] species is required.`);
      return new Response(JSON.stringify({ error: 'species is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    console.log(`[${requestTimestamp}] Processing species: ${species}, commonName: ${commonName}`);

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    console.log(`[${requestTimestamp}] Calling OpenAI API...`);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Complete the missing information for this plant:
Species: ${species}
${commonName ? `Common name: ${commonName}` : ''}

Please provide:
1. plantEnvironment (interior/exterior/ambos)
2. lightRequirements (poca_luz/luz_indirecta/luz_directa_parcial/pleno_sol)
3. description (optional, in Spanish, minimum 50 words)
4. funFacts (optional, exactly 5 facts in Spanish)

Respond in JSON format:
{
  "plantEnvironment": "interior|exterior|ambos",
  "lightRequirements": "poca_luz|luz_indirecta|luz_directa_parcial|pleno_sol",
  "description": "optional description in Spanish",
  "funFacts": ["fact1", "fact2", "fact3", "fact4", "fact5"]
}`
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    console.log(`[${requestTimestamp}] Raw OpenAI response:`, content);

    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error(`[${requestTimestamp}] Failed to parse JSON response:`, parseError);
      // Fallback response
      parsedResponse = {
        plantEnvironment: 'interior',
        lightRequirements: 'luz_indirecta',
        description: `${species} es una especie que requiere cuidados específicos. Se caracteriza por sus necesidades particulares de riego, luz y temperatura. Es importante mantener un ambiente adecuado para su crecimiento saludable y desarrollo óptimo.`,
        funFacts: [
          'Es una planta que requiere cuidados específicos.',
          'Su crecimiento depende de las condiciones ambientales.',
          'La luz y el agua son factores clave para su desarrollo.',
          'Puede adaptarse a diferentes tipos de suelo.',
          'Su mantenimiento regular asegura un crecimiento saludable.'
        ]
      };
    }

    // Validate and sanitize response
    const validEnvironments = ['interior', 'exterior', 'ambos'];
    const validLightRequirements = ['poca_luz', 'luz_indirecta', 'luz_directa_parcial', 'pleno_sol'];

    const result = {
      plantEnvironment: validEnvironments.includes(parsedResponse.plantEnvironment) 
        ? parsedResponse.plantEnvironment 
        : 'interior',
      lightRequirements: validLightRequirements.includes(parsedResponse.lightRequirements)
        ? parsedResponse.lightRequirements
        : 'luz_indirecta',
      description: typeof parsedResponse.description === 'string' ? parsedResponse.description : undefined,
      funFacts: Array.isArray(parsedResponse.funFacts) ? parsedResponse.funFacts : undefined,
    };

    console.log(`[${requestTimestamp}] Returning result:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[${requestTimestamp}] Error in complete-plant-info function:`, error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 