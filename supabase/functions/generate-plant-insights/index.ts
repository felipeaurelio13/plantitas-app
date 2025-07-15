// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { OpenAI } from "https://deno.land/x/openai/mod.ts";

const openai = new OpenAI(Deno.env.get('OPENAI_API_KEY'));

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

    const prompt = `
      Analyze the following plant data and generate 3-5 actionable, data-driven insights.
      Focus on potential improvements, warnings, or interesting correlations in the data.
      Each insight should be a short, clear statement.

      Plant Data:
      - Species: ${plant.species} (${plant.name})
      - Health Score: ${plant.healthScore}/100
      - Location: ${plant.location}
      - Care Profile:
        - Watering: Every ${plant.careProfile.wateringFrequency} days
        - Sunlight: ${plant.careProfile.sunlightRequirement}
        - Humidity: ${plant.careProfile.humidityPreference}
      - Recent Chat Messages: ${plant.chatHistory.slice(-3).map((m: { content: string }) => m.content).join('; ')}

      Example Insights:
      - "Your plant's health has been trending down. Consider checking for pests."
      - "You mentioned 'yellow leaves' in a recent chat. This could be a sign of overwatering."
      - "This plant prefers high humidity, but your room is listed as 'low'. Misting might help."

      Generate insights for the provided plant data:
    `;

    const chatCompletion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { "role": "system", "content": "You are a helpful plant care assistant." },
        { "role": "user", "content": prompt }
      ],
      max_tokens: 150,
      temperature: 0.5,
    });
    
    const insights = chatCompletion.choices[0].message.content
      .split('\n')
      .map((s: string) => s.replace(/^- /, '').trim())
      .filter((s: string) => s.length > 0);

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-plant-insights' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
