/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import OpenAI from 'https://esm.sh/openai@4.10.0';
import { z } from 'https://esm.sh/zod@3.23.8';
import { zodToJsonSchema } from 'https://esm.sh/zod-to-json-schema@3.23.0';

// The Zod schema remains the single source of truth.
const HealthIssueSchema = z.object({
  type: z.enum(['overwatering', 'underwatering', 'pest', 'disease', 'nutrient', 'light', 'other']),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string().min(1).describe("A description of the specific health issue in Spanish."),
  treatment: z.string().min(1).describe("A recommended treatment for the issue in Spanish."),
});

const HealthAnalysisSchema = z.object({
  overallHealth: z.enum(['excellent', 'good', 'fair', 'poor']),
  issues: z.array(HealthIssueSchema),
  recommendations: z.array(z.string()).describe("A list of general recommendations for the plant's health in Spanish."),
  moistureLevel: z.coerce.number().min(0).max(100).describe("An estimated moisture level of the soil from 0 to 100."),
  growthStage: z.enum(['seedling', 'juvenile', 'mature', 'flowering', 'dormant']),
  confidence: z.coerce.number().min(0).max(100).describe("The confidence level (0-100) in this health analysis."),
});

const CareProfileSchema = z.object({
  wateringFrequency: z.coerce.number().positive().describe("Recommended watering frequency in days."),
  sunlightRequirement: z.enum(['low', 'medium', 'high']),
  humidityPreference: z.enum(['low', 'medium', 'high']),
  temperatureRange: z.object({
    min: z.coerce.number().describe("Minimum recommended temperature in Celsius."),
    max: z.coerce.number().describe("Maximum recommended temperature in Celsius."),
  }),
  fertilizingFrequency: z.coerce.number().positive().describe("Recommended fertilizing frequency in days."),
  soilType: z.string().min(1).describe("Recommended soil type in Spanish."),
  specialCare: z.array(z.string()).optional().describe("A list of special care instructions in Spanish, if any."),
});

const PlantPersonalitySchema = z.object({
  traits: z.array(z.string()).min(1).describe("A list of personality traits for the plant in Spanish (e.g., 'Resiliente', 'De crecimiento rápido')."),
  communicationStyle: z.enum(['cheerful', 'wise', 'dramatic', 'calm', 'playful']),
  catchphrases: z.array(z.string()).describe("A list of short, fun catchphrases the plant might say, in Spanish."),
  moodFactors: z.object({
    health: z.coerce.number().min(0).max(1).describe("Weight factor for health in mood calculation (0-1)."),
    care: z.coerce.number().min(0).max(1).describe("Weight factor for care in mood calculation (0-1)."),
    attention: z.coerce.number().min(0).max(1).describe("Weight factor for attention in mood calculation (0-1)."),
  }),
});

const AIAnalysisResponseSchema = z.object({
  species: z.string().describe("The scientific name of the plant species."),
  commonName: z.string().describe("The common name of the plant in Spanish."),
  variety: z.string().nullable().optional().describe("The specific variety of the plant, if identifiable."),
  confidence: z.coerce.number().min(0).max(100).describe("The confidence level (0-100) in the species identification."),
  generalDescription: z.string().min(20).describe("A detailed paragraph in Spanish about the plant species: its origins, general characteristics, and basic care tips."),
  funFacts: z.array(z.string()).min(5).max(5).describe("Exactly 5 fun facts about the plant species, in Spanish."),
  // Nuevos campos para ambiente y luz
  plantEnvironment: z.enum(['interior', 'exterior', 'ambos']).describe("Indica si la planta es de interior, exterior o puede estar en ambos ambientes."),
  lightRequirements: z.enum(['poca_luz', 'luz_indirecta', 'luz_directa_parcial', 'pleno_sol']).describe("Especifica las necesidades de luz de la planta."),
  health: HealthAnalysisSchema,
  careProfile: CareProfileSchema,
  personality: PlantPersonalitySchema,
});

// Convert the Zod schema to a JSON schema for the OpenAI tool
const analysisSchemaAsJson = zodToJsonSchema(AIAnalysisResponseSchema, "analysisSchema");

/**
 * A brute-force function to ensure the data strictly conforms to the schema.
 * It builds a new object from the AI's response, providing safe defaults for
 * any missing or malformed fields. This is the final line of defense.
 * @param data The raw, parsed data from the AI tool call.
 * @returns A guaranteed-to-be-valid data object.
 */
const forceSchema = (data: any): z.infer<typeof AIAnalysisResponseSchema> => {
  const safeData = data || {};
  const health = safeData.health || {};
  const careProfile = safeData.careProfile || {};
  const personality = safeData.personality || {};
  const tempRange = careProfile.temperatureRange || {};
  const moodFactors = personality.moodFactors || {};

  // For generalDescription, only use fallback if completely missing or empty
  let description = safeData.generalDescription;
  if (!description || description.trim().length === 0) {
    // Try to generate a basic description from available data
    const plantName = safeData.commonName || safeData.species || 'Esta planta';
    description = `${plantName} es una especie que requiere cuidados específicos. Se caracteriza por sus necesidades particulares de riego, luz y temperatura. Es importante mantener un ambiente adecuado para su crecimiento saludable.`;
  }

  return {
    species: safeData.species || 'Especie no identificada',
    commonName: safeData.commonName || 'Planta desconocida',
    variety: safeData.variety || null,
    confidence: typeof safeData.confidence === 'number' ? safeData.confidence : 0,
    generalDescription: description,
    funFacts: Array.isArray(safeData.funFacts) && safeData.funFacts.length === 5 ? safeData.funFacts : [
      'Es una planta que requiere cuidados específicos.',
      'Su crecimiento depende de las condiciones ambientales.',
      'La luz y el agua son factores clave para su desarrollo.',
      'Puede adaptarse a diferentes tipos de suelo.',
      'Su mantenimiento regular asegura un crecimiento saludable.'
    ],
    // Nuevos campos para ambiente y luz con valores por defecto
    plantEnvironment: ['interior', 'exterior', 'ambos'].includes(safeData.plantEnvironment) ? safeData.plantEnvironment : 'interior',
    lightRequirements: ['poca_luz', 'luz_indirecta', 'luz_directa_parcial', 'pleno_sol'].includes(safeData.lightRequirements) ? safeData.lightRequirements : 'luz_indirecta',
    health: {
      overallHealth: ['excellent', 'good', 'fair', 'poor'].includes(health.overallHealth) ? health.overallHealth : 'fair',
      issues: Array.isArray(health.issues) ? health.issues : [],
      recommendations: Array.isArray(health.recommendations) ? health.recommendations : [],
      moistureLevel: typeof health.moistureLevel === 'number' ? health.moistureLevel : 50,
      growthStage: ['seedling', 'juvenile', 'mature', 'flowering', 'dormant'].includes(health.growthStage) ? health.growthStage : 'mature',
      confidence: typeof health.confidence === 'number' ? health.confidence : 0,
    },
    careProfile: {
      wateringFrequency: typeof careProfile.wateringFrequency === 'number' ? careProfile.wateringFrequency : 7,
      sunlightRequirement: ['low', 'medium', 'high'].includes(careProfile.sunlightRequirement) ? careProfile.sunlightRequirement : 'medium',
      humidityPreference: ['low', 'medium', 'high'].includes(careProfile.humidityPreference) ? careProfile.humidityPreference : 'medium',
      temperatureRange: {
        min: typeof tempRange.min === 'number' ? tempRange.min : 18,
        max: typeof tempRange.max === 'number' ? tempRange.max : 25,
      },
      fertilizingFrequency: typeof careProfile.fertilizingFrequency === 'number' ? careProfile.fertilizingFrequency : 30,
      soilType: careProfile.soilType || 'Tierra para macetas estándar',
      specialCare: Array.isArray(careProfile.specialCare) ? careProfile.specialCare : [],
    },
    personality: {
      traits: Array.isArray(personality.traits) && personality.traits.length > 0 ? personality.traits : ['Misteriosa'],
      communicationStyle: ['cheerful', 'wise', 'dramatic', 'calm', 'playful'].includes(personality.communicationStyle) ? personality.communicationStyle : 'calm',
      catchphrases: Array.isArray(personality.catchphrases) ? personality.catchphrases : ['...'],
      moodFactors: {
        health: typeof moodFactors.health === 'number' ? moodFactors.health : 0.4,
        care: typeof moodFactors.care === 'number' ? moodFactors.care : 0.4,
        attention: typeof moodFactors.attention === 'number' ? moodFactors.attention : 0.2,
      },
    },
  };
};


const SYSTEM_PROMPT = `You are an expert botanist and plant psychologist. Your goal is to analyze the user's image of a plant and provide a complete, detailed analysis by calling the 'submit_plant_analysis' tool.

**CRITICAL INSTRUCTIONS:**
1.  **COMPLETE ANALYSIS**: You MUST fill every single field in the schema, including all nested objects. Do not omit any fields.
2.  **LANGUAGE**: All descriptive, free-text fields MUST be in SPANISH. All fields with predefined options (enums) MUST use the specified ENGLISH values from the schema.
3.  **ACCURACY**: Provide the most accurate analysis possible. If you are uncertain about a specific detail, make a reasonable, educated guess.
4.  **DETAILED DESCRIPTION**: The 'generalDescription' field MUST contain a comprehensive paragraph (minimum 50 words) in Spanish describing the plant species, its origins, natural habitat, general characteristics, and basic care overview. NEVER leave this field empty or use placeholder text.
5.  **FUN FACTS**: Provide exactly 5 interesting, educational facts about the plant species in Spanish. These should be specific and informative.
6.  **PLANT ENVIRONMENT & LIGHT**: MANDATORY fields to analyze:
    - plantEnvironment: Determine if this plant species is best suited for 'interior' (indoor houseplant), 'exterior' (outdoor garden plant), or 'ambos' (can thrive in both environments)
    - lightRequirements: Specify light needs as 'poca_luz' (low light, shade-tolerant), 'luz_indirecta' (bright indirect light), 'luz_directa_parcial' (partial direct sunlight), or 'pleno_sol' (full sun requirements)
7.  **FAILURE CASE**: If you cannot identify a plant in the image, you must still call the function. Use "Planta no identificada" for names and descriptions, and provide default or null values for the other fields. DO NOT skip the function call.
`;

serve(async (req: Request) => {
  const requestTimestamp = new Date().toISOString();
  console.log(`[${requestTimestamp}] Function received a request. Method: ${req.method}`);

  if (req.method === 'OPTIONS') {
    console.log(`[${requestTimestamp}] Handling OPTIONS request.`);
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`[${requestTimestamp}] Request is not OPTIONS, processing as POST.`);
    const { imageDataUrl } = await req.json();

    if (!imageDataUrl) {
      console.error(`[${requestTimestamp}] imageDataUrl is required.`);
      return new Response(JSON.stringify({ error: 'imageDataUrl is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    console.log(`[${requestTimestamp}] Parsed imageDataUrl from request body.`);

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.log(`[${requestTimestamp}] OpenAI request timed out after 25 seconds.`);
      controller.abort();
    }, 25000); // 25 seconds

    console.log(`[${requestTimestamp}] Calling OpenAI API with Tool Calling...`);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageDataUrl, detail: 'high' },
            },
          ],
        },
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'submit_plant_analysis',
          description: 'Submits the complete analysis of the plant in the image.',
          parameters: analysisSchemaAsJson,
        },
      }],
      tool_choice: {
        type: 'function',
        function: { name: 'submit_plant_analysis' },
      },
      max_tokens: 2500,
      temperature: 0.2,
    }, { signal: controller.signal });

    clearTimeout(timeout);
    console.log(`[${requestTimestamp}] Received response from OpenAI.`);

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.type !== 'function') {
      console.error(`[${requestTimestamp}] OpenAI did not return a valid tool call. Response:`, JSON.stringify(response, null, 2));
      throw new Error('AI response did not follow the expected tool call format.');
    }

    const content = toolCall.function.arguments;

    if (!content) {
      console.error(`[${requestTimestamp}] OpenAI tool call arguments are empty.`);
      throw new Error('OpenAI returned an empty analysis.');
    }

    console.log(`[${requestTimestamp}] Raw arguments from tool call:`, content);
    console.log(`[${requestTimestamp}] Parsing tool call arguments...`);
    const rawData = JSON.parse(content);

    // Use the brute-force schema enforcer
    console.log(`[${requestTimestamp}] Forcing data into schema...`);
    const finalData = forceSchema(rawData);

    // Final validation for logging purposes, should always pass.
    const validationResult = AIAnalysisResponseSchema.safeParse(finalData);

    if (!validationResult.success) {
      console.error(`[${requestTimestamp}] Zod validation failed AFTER forcing the schema. This is a critical logic error.`);
      console.error('Validation Errors:', validationResult.error.flatten());
      console.error('Data that failed validation:', JSON.stringify(finalData, null, 2));
      throw new Error('A critical error occurred while formatting the AI response.');
    }

    console.log(`[${requestTimestamp}] Validation successful. Returning structured, guaranteed-valid data.`);
    return new Response(JSON.stringify(validationResult.data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[${requestTimestamp}] An unhandled error occurred:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(JSON.stringify({ error: `Internal Server Error: ${errorMessage}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
