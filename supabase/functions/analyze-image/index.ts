/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import OpenAI from 'https://esm.sh/openai@4.10.0';
import { z } from 'https://esm.sh/zod@3.23.8';

// WORKAROUND: The schema is duplicated here to make the function self-contained
// and avoid bundling issues with cross-directory imports. This ensures stability.
const HealthIssueSchema = z.object({
  type: z.enum(['overwatering', 'underwatering', 'pest', 'disease', 'nutrient', 'light', 'other']),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string().min(1),
  treatment: z.string().min(1),
});

const HealthAnalysisSchema = z.object({
  overallHealth: z.enum(['excellent', 'good', 'fair', 'poor']),
  issues: z.array(HealthIssueSchema),
  recommendations: z.array(z.string()),
  moistureLevel: z.coerce.number().min(0).max(100),
  growthStage: z.enum(['seedling', 'juvenile', 'mature', 'flowering', 'dormant']),
  confidence: z.coerce.number().min(0).max(100),
});

const CareProfileSchema = z.object({
  wateringFrequency: z.coerce.number().positive(),
  sunlightRequirement: z.enum(['low', 'medium', 'high']),
  humidityPreference: z.enum(['low', 'medium', 'high']),
  temperatureRange: z.object({
    min: z.coerce.number(),
    max: z.coerce.number(),
  }),
  fertilizingFrequency: z.coerce.number().positive(),
  soilType: z.string().min(1),
  specialCare: z.array(z.string()).optional(),
});

const PlantPersonalitySchema = z.object({
  traits: z.array(z.string()).min(1),
  communicationStyle: z.enum(['cheerful', 'wise', 'dramatic', 'calm', 'playful']),
  catchphrases: z.array(z.string()),
  moodFactors: z.object({
    health: z.coerce.number().min(0).max(1),
    care: z.coerce.number().min(0).max(1),
    attention: z.coerce.number().min(0).max(1),
  }),
});

const AIAnalysisResponseSchema = z.object({
  species: z.string(),
  commonName: z.string(),
  variety: z.string().nullable().optional(),
  confidence: z.coerce.number().min(0).max(100),
  generalDescription: z.string().min(20, { message: "Description must be at least 20 characters."}),
  health: HealthAnalysisSchema,
  careProfile: CareProfileSchema,
  personality: PlantPersonalitySchema,
});


/**
 * This is our specialized "Data Cleaning AI Agent".
 * Its mission is to take raw, potentially messy data from the primary AI
 * and rigorously transform it to match our strict schema.
 * @param data The raw data object from OpenAI.
 * @returns A cleaned data object, ready for validation.
 */
const cleanDataWithAgent = (data: any): any => {
  const translationMap: { [key: string]: string } = {
    // Health
    'excelente': 'excellent', 'bueno': 'good', 'regular': 'fair', 'malo': 'poor',
    // Growth Stage
    'semillero': 'seedling', 'juvenil': 'juvenile', 'madura': 'mature', 'maduro': 'mature', 'floración': 'flowering', 'floracion': 'flowering', 'durmiente': 'dormant',
    // Issue Type
    'riego excesivo': 'overwatering', 'exceso de riego': 'overwatering', 'falta de riego': 'underwatering', 'plaga': 'pest', 'enfermedad': 'disease', 'nutrientes': 'nutrient', 'luz': 'light', 'otro': 'other',
    // Severity & Preferences
    'bajo': 'low', 'baja': 'low', 'medio': 'medium', 'media': 'medium', 'alto': 'high', 'alta': 'high',
    // Communication Style
    'alegre': 'cheerful', 'sabio': 'wise', 'dramático': 'dramatic', 'dramatico': 'dramatic', 'calmado': 'calm', 'juguetón': 'playful', 'jugueton': 'playful'
  };

  if (typeof data === 'string') {
    const lowerCaseData = data.toLowerCase().trim();
    if (translationMap[lowerCaseData]) {
      return translationMap[lowerCaseData];
    }
    // Coerce numeric strings to numbers, but not empty strings
    if (data.trim() !== '' && !isNaN(Number(data))) {
      return Number(data);
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => cleanDataWithAgent(item));
  }

  if (typeof data === 'object' && data !== null) {
    return Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = cleanDataWithAgent(value);
      return acc;
    }, {} as { [key: string]: any });
  }

  return data;
};


const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const PLANT_IDENTIFICATION_PROMPT = `You are an expert botanist specializing in identifying domestic plants. Analyze this image and provide a complete analysis in JSON format.

**CRITICAL JSON OUTPUT RULES:**
1.  **ONLY JSON**: Your entire response must be a single, valid JSON object. Do not include any text before or after the JSON.
2.  **STRICT DATA TYPES**: All numeric values (like confidence, frequency, temperature) MUST be numbers, not strings.
3.  **ENGLISH ENUMS**: All fields with predefined options (enums) MUST use the specified English values. Any other value is invalid.
4.  **SPANISH TEXT**: All free-text fields (like commonName, description, recommendations, traits) MUST be in Spanish.
5.  **COMPLETE OBJECT**: You must provide all fields specified in the structure below. If a value is unknown, use a sensible default or null for optional fields.

**JSON Structure:**
{
  "species": "scientific_name",
  "commonName": "spanish_common_name",
  "variety": "specific_variety_or_null",
  "confidence": 100,
  "generalDescription": "A detailed paragraph in Spanish about the plant species: its origins, general characteristics, and basic care tips.",
  "health": {
    "overallHealth": "good", // Must be one of: "excellent", "good", "fair", "poor"
    "issues": [{
        "type": "pest", // Must be one of: "overwatering", "underwatering", "pest", "disease", "nutrient", "light", "other"
        "severity": "low", // Must be one of: "low", "medium", "high"
        "description": "description_in_spanish",
        "treatment": "treatment_in_spanish"
    }],
    "recommendations": ["recommendation_1_in_spanish"],
    "moistureLevel": 60,
    "growthStage": "juvenile", // Must be one of: "seedling", "juvenile", "mature", "flowering", "dormant"
    "confidence": 90
  },
  "careProfile": {
    "wateringFrequency": 7,
    "sunlightRequirement": "medium", // Must be one of: "low", "medium", "high"
    "humidityPreference": "medium", // Must be one of: "low", "medium", "high"
    "temperatureRange": {"min": 18, "max": 27},
    "fertilizingFrequency": 30,
    "soilType": "soil_description_in_spanish",
    "specialCare": ["special_care_in_spanish"]
  },
  "personality": {
    "traits": ["trait_1_in_spanish"],
    "communicationStyle": "calm", // Must be one of: "cheerful", "wise", "dramatic", "calm", "playful"
    "catchphrases": ["catchphrase_in_spanish"],
    "moodFactors": {"health": 0.4, "care": 0.4, "attention": 0.2}
  }
}

If you absolutely cannot identify a plant in the image, respond with ONLY this JSON:
{ "error": "No plant could be identified in the image." }
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

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.log(`[${requestTimestamp}] OpenAI request timed out after 25 seconds.`);
      controller.abort();
    }, 25000); // 25 seconds

    console.log(`[${requestTimestamp}] Calling OpenAI API...`);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: PLANT_IDENTIFICATION_PROMPT,
        },
        {
          role: 'user',
          content: [
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
      max_tokens: 2000,
      temperature: 0.2,
    }, { signal: controller.signal });

    clearTimeout(timeout);
    console.log(`[${requestTimestamp}] Received response from OpenAI.`);

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.error(`[${requestTimestamp}] OpenAI response is empty.`);
      throw new Error('OpenAI returned an empty response.');
    }

    // Log the raw content before any parsing
    console.log(`[${requestTimestamp}] Raw content from OpenAI:`, content);

    console.log(`[${requestTimestamp}] Parsing OpenAI response...`);
    const rawData = JSON.parse(content);

    // Engaging the Data Cleaning Agent
    console.log(`[${requestTimestamp}] Engaging Data Cleaning Agent to sanitize response...`);
    const cleanedData = cleanDataWithAgent(rawData);
    console.log(`[${requestTimestamp}] Sanitized Data:`, JSON.stringify(cleanedData, null, 2));


    // Check for an application-specific error returned by the AI
    if (cleanedData.error) {
      console.warn(`[${requestTimestamp}] AI returned a specific error: ${cleanedData.error}`);
      return new Response(JSON.stringify({ error: cleanedData.error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400, // Bad Request, as the image was not identifiable
      });
    }

    console.log(`[${requestTimestamp}] Validating sanitized data against schema...`);
    const validationResult = AIAnalysisResponseSchema.safeParse(cleanedData);

    if (!validationResult.success) {
      console.error(`[${requestTimestamp}] Zod validation failed AFTER cleaning.`);
      console.error('Validation Errors:', validationResult.error.flatten());
      console.error('Data that failed validation:', JSON.stringify(cleanedData, null, 2));
      throw new Error('AI response did not match the required data structure, even after cleaning.');
    }

    console.log(`[${requestTimestamp}] Validation successful. Returning cleaned data.`);
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