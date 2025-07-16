/// <reference types="https://esm.sh/@supabase/functions-js@2/src/edge-runtime.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import OpenAI from 'https://esm.sh/openai@4.10.0';
import { z } from 'https://esm.sh/zod@3.23.8';

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

const HEALTH_DIAGNOSIS_PROMPT = `You are an expert botanist analyzing a plant's health. Look carefully at this plant image and provide a comprehensive health analysis.

**CRITICAL INSTRUCTIONS:**
1. **HEALTH FOCUS**: Focus specifically on the plant's current health status
2. **VISUAL ASSESSMENT**: Analyze visible signs of health/illness in the image
3. **ACCURATE RATING**: Provide an honest assessment of overall health
4. **LANGUAGE**: All text fields must be in SPANISH
5. **COMPLETE RESPONSE**: Fill all required fields

Rate the overall health as:
- 'excellent': Plant looks vibrant, healthy leaves, good color, no visible issues
- 'good': Plant looks healthy with minor imperfections
- 'fair': Plant shows some signs of stress but is recoverable
- 'poor': Plant shows significant health issues requiring immediate attention

Provide specific recommendations in Spanish for improving the plant's health.`;

serve(async (req: Request) => {
  const requestTimestamp = new Date().toISOString();
  console.log(`[${requestTimestamp}] Update-health-diagnosis function received a request. Method: ${req.method}`);

  if (req.method === 'OPTIONS') {
    console.log(`[${requestTimestamp}] Handling OPTIONS request.`);
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`[${requestTimestamp}] Processing health diagnosis request.`);
    const { imageUrl, plantName, species } = await req.json();

    if (!imageUrl) {
      console.error(`[${requestTimestamp}] imageUrl is required.`);
      return new Response(JSON.stringify({ error: 'imageUrl is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`[${requestTimestamp}] Analyzing health for plant: ${plantName || species || 'Unknown'}`);
    console.log(`[${requestTimestamp}] Image URL: ${imageUrl.substring(0, 100)}...`);

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    if (!openai.apiKey) {
      console.error(`[${requestTimestamp}] OpenAI API key not found.`);
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Add timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.error(`[${requestTimestamp}] Request timed out after 25 seconds.`);
      controller.abort();
    }, 25000);

    console.log(`[${requestTimestamp}] Calling OpenAI for health analysis...`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: HEALTH_DIAGNOSIS_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze the health of this ${species || plantName || 'plant'}. Provide a detailed health assessment.`,
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' },
            },
          ],
        },
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'submit_health_analysis',
          description: 'Submit the health analysis of the plant',
          parameters: {
            type: 'object',
            properties: {
              overallHealth: {
                type: 'string',
                enum: ['excellent', 'good', 'fair', 'poor'],
                description: 'Overall health assessment of the plant'
              },
              issues: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['overwatering', 'underwatering', 'pest', 'disease', 'nutrient', 'light', 'other']
                    },
                    severity: {
                      type: 'string',
                      enum: ['low', 'medium', 'high']
                    },
                    description: {
                      type: 'string',
                      description: 'Description in Spanish'
                    },
                    treatment: {
                      type: 'string',
                      description: 'Treatment recommendation in Spanish'
                    }
                  },
                  required: ['type', 'severity', 'description', 'treatment']
                }
              },
              recommendations: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'General care recommendations in Spanish'
              },
              moistureLevel: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                description: 'Estimated soil moisture level percentage'
              },
              growthStage: {
                type: 'string',
                enum: ['seedling', 'juvenile', 'mature', 'flowering', 'dormant'],
                description: 'Current growth stage of the plant'
              },
              confidence: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                description: 'Confidence level in this health analysis'
              }
            },
            required: ['overallHealth', 'issues', 'recommendations', 'moistureLevel', 'growthStage', 'confidence']
          }
        },
      }],
      tool_choice: {
        type: 'function',
        function: { name: 'submit_health_analysis' },
      },
      max_tokens: 1500,
      temperature: 0.3,
    }, { signal: controller.signal });

    clearTimeout(timeout);
    console.log(`[${requestTimestamp}] Received response from OpenAI.`);

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.type !== 'function') {
      console.error(`[${requestTimestamp}] OpenAI did not return a valid tool call.`);
      return new Response(JSON.stringify({ error: 'AI analysis failed to return valid health data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const content = toolCall.function.arguments;
    if (!content) {
      console.error(`[${requestTimestamp}] OpenAI tool call arguments are empty.`);
      return new Response(JSON.stringify({ error: 'AI analysis returned empty health data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`[${requestTimestamp}] Raw health analysis:`, content);
    
    let rawData;
    try {
      rawData = JSON.parse(content);
    } catch (parseError) {
      console.error(`[${requestTimestamp}] Failed to parse AI response:`, parseError);
      return new Response(JSON.stringify({ error: 'AI response format error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Apply safety defaults
    const safeData = {
      overallHealth: ['excellent', 'good', 'fair', 'poor'].includes(rawData.overallHealth) 
        ? rawData.overallHealth : 'fair',
      issues: Array.isArray(rawData.issues) ? rawData.issues : [],
      recommendations: Array.isArray(rawData.recommendations) ? rawData.recommendations : [
        'Mantén un riego regular según las necesidades de la planta',
        'Asegúrate de que reciba la cantidad adecuada de luz',
        'Revisa periódicamente en busca de plagas o enfermedades'
      ],
      moistureLevel: typeof rawData.moistureLevel === 'number' ? rawData.moistureLevel : 50,
      growthStage: ['seedling', 'juvenile', 'mature', 'flowering', 'dormant'].includes(rawData.growthStage)
        ? rawData.growthStage : 'mature',
      confidence: typeof rawData.confidence === 'number' ? rawData.confidence : 70,
    };

    // Validate with schema
    const validationResult = HealthAnalysisSchema.safeParse(safeData);
    if (!validationResult.success) {
      console.error(`[${requestTimestamp}] Health analysis validation failed:`, validationResult.error);
      return new Response(JSON.stringify({ error: 'Health analysis validation failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`[${requestTimestamp}] Health analysis successful:`, {
      overallHealth: validationResult.data.overallHealth,
      confidence: validationResult.data.confidence,
      issuesCount: validationResult.data.issues.length
    });

    return new Response(JSON.stringify(validationResult.data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[${requestTimestamp}] Unhandled error in health diagnosis:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({ 
      error: `Health diagnosis failed: ${errorMessage}`,
      timestamp: requestTimestamp 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 