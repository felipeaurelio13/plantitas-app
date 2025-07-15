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

    if (!plant) {
      return new Response(JSON.stringify({ error: 'Plant data is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = getInsightAgentPrompt(plant);

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

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response.');
    }

    // The AI might wrap the array in a parent object, e.g., { "insights": [...] }
    let rawData = JSON.parse(content);
    if (rawData.insights && Array.isArray(rawData.insights)) {
      rawData = rawData.insights;
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
