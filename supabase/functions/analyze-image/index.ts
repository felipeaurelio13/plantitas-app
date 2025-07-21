/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import OpenAI from 'https://esm.sh/openai@4.10.0';
import { z } from 'https://esm.sh/zod@3.23.8';
import { zodToJsonSchema } from 'https://esm.sh/zod-to-json-schema@3.23.0';

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

// CORS headers inline to avoid dependency issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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


const SYSTEM_PROMPT = `You are an expert botanist and plant psychologist with advanced analytical capabilities. Your mission is to provide the most accurate and comprehensive plant analysis possible.

**ENHANCED ANALYSIS PROTOCOL (2025):**

**Step 1: Visual Inspection Process**
First, examine the image systematically:
- Overall plant structure and morphology
- Leaf shape, size, arrangement, and surface characteristics
- Stem/trunk characteristics and growth pattern
- Visible flowers, fruits, or reproductive structures
- Root system (if visible)
- Container and growing environment
- Any signs of stress, disease, or health issues

**Step 2: Species Identification**
Based on your systematic examination:
- Identify the plant family and genus
- Determine the most likely species
- Consider regional varieties and cultivars
- Assess confidence level in identification

**Step 3: Health Assessment**
Evaluate the plant's current condition:
- Overall vigor and appearance
- Signs of proper or improper care
- Environmental stress indicators
- Nutrient deficiencies or excesses
- Pest or disease presence

**Step 4: Complete Analysis Compilation**
Using the submit_plant_analysis tool, provide:

**CRITICAL REQUIREMENTS:**
1. **COMPLETE DATA**: Fill every field in the schema without omissions
2. **LANGUAGE PROTOCOL**: 
   - All descriptive text → SPANISH
   - All enum values → ENGLISH (exactly as specified)
3. **ACCURACY STANDARD**: Provide scientifically accurate information
4. **DETAILED DESCRIPTIONS**: Minimum 50 words for generalDescription
5. **EDUCATIONAL VALUE**: Include 5 specific, interesting facts
6. **ENVIRONMENTAL ASSESSMENT**: 
   - plantEnvironment: 'interior'|'exterior'|'ambos'
   - lightRequirements: 'poca_luz'|'luz_indirecta'|'luz_directa_parcial'|'pleno_sol'
7. **FAILURE PROTOCOL**: If plant cannot be identified, use "Planta no identificada" but still complete all fields with reasonable defaults

**CONFIDENCE INDICATORS**: Base your confidence score (0-100) on:
- Image clarity and quality
- Visible identifying features
- Certainty of species identification
- Health assessment accuracy

Think step-by-step through your analysis before submitting results.`;

serve(async (req: Request) => {
  const requestTimestamp = new Date().toISOString();
  console.log(`[${requestTimestamp}] Enhanced analyze-image function received request. Method: ${req.method}`);

  if (req.method === 'OPTIONS') {
    console.log(`[${requestTimestamp}] Handling OPTIONS request.`);
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`[${requestTimestamp}] Processing image analysis request...`);
    const { imageDataUrl } = await req.json();

    if (!imageDataUrl) {
      console.error(`[${requestTimestamp}] imageDataUrl is required.`);
      return new Response(JSON.stringify({ error: 'imageDataUrl is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Estimate tokens and complexity for optimal model selection
    const estimatedTokens = estimateTokens(SYSTEM_PROMPT, true); // true for image
    const complexity = estimatedTokens > 1500 ? 'high' : 'medium';
    
    // Select optimal model based on complexity and cost considerations
    const selectedModel = selectOptimalModel('image_analysis', complexity, 'balanced');
    
    console.log(`[${requestTimestamp}] Selected model: ${selectedModel}, complexity: ${complexity}, estimated tokens: ${estimatedTokens}`);

    // Check cache first
    const cacheInput = { imageDataUrl, model: selectedModel };
    const cachedResult = await getCachedResponse('image_analysis', cacheInput);
    
    if (cachedResult) {
      console.log(`[${requestTimestamp}] Cache HIT - returning cached analysis`);
      return new Response(JSON.stringify(cachedResult), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        },
      });
    }

    console.log(`[${requestTimestamp}] Cache MISS - proceeding with AI analysis`);

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Use enhanced OpenAI call with retry logic and monitoring
    const response = await enhancedOpenAICall(
      openai,
      'image_analysis',
      (signal: AbortSignal) => openai.chat.completions.create({
        model: selectedModel,
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
      }, { signal }),
      {
        model: selectedModel,
        complexity,
        retryConfig: { maxRetries: 2 }, // Fewer retries for image analysis
        context: { operation: 'image_analysis', hasImage: true }
      }
    );

    console.log(`[${requestTimestamp}] Received response from OpenAI with enhanced error handling.`);

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.type !== 'function') {
      console.error(`[${requestTimestamp}] OpenAI did not return a valid tool call.`);
      throw new EnhancedAIError(
        new Error('AI response did not follow the expected tool call format.'),
        { requestTimestamp, model: selectedModel, complexity }
      );
    }

    const content = toolCall.function.arguments;

    if (!content) {
      console.error(`[${requestTimestamp}] OpenAI tool call arguments are empty.`);
      throw new EnhancedAIError(
        new Error('OpenAI returned an empty analysis.'),
        { requestTimestamp, model: selectedModel }
      );
    }

    console.log(`[${requestTimestamp}] Processing tool call arguments...`);
    const rawData = JSON.parse(content);

    // Use the brute-force schema enforcer
    console.log(`[${requestTimestamp}] Enforcing schema compliance...`);
    const finalData = forceSchema(rawData);

    // Final validation for logging purposes
    const validationResult = AIAnalysisResponseSchema.safeParse(finalData);

    if (!validationResult.success) {
      console.error(`[${requestTimestamp}] Zod validation failed AFTER forcing the schema. This is a critical logic error.`);
      console.error('Validation Errors:', validationResult.error.flatten());
      console.error('Data that failed validation:', JSON.stringify(finalData, null, 2));
      throw new Error('A critical error occurred while formatting the AI response.');
    }

    console.log(`[${requestTimestamp}] Validation successful. Caching result and returning data.`);
    
    // Cache the successful result for future use
    await setCachedResponse('image_analysis', cacheInput, validationResult.data);
    
    return new Response(JSON.stringify(validationResult.data), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Cache': 'MISS'
      },
      status: 200,
    });

  } catch (error) {
    console.error(`[${requestTimestamp}] Enhanced error handling - Error details:`, {
      error: error instanceof Error ? error.message : error,
      classification: error instanceof EnhancedAIError ? error.classification : null,
      context: error instanceof EnhancedAIError ? error.context : {},
      timestamp: requestTimestamp
    });

    // Determine appropriate response based on error type
    if (error instanceof EnhancedAIError) {
      const { classification } = error;
      const statusCode = classification.errorType === 'auth_error' ? 401 :
                        classification.errorType === 'rate_limit' ? 429 :
                        classification.errorType === 'content_policy' ? 400 : 500;

      return new Response(JSON.stringify({ 
        error: error.message,
        type: classification.errorType,
        retryable: classification.isRetryable,
        severity: classification.severity
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      });
    }

    // Fallback for unknown errors
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(JSON.stringify({ error: `Internal Server Error: ${errorMessage}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
