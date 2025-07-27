import { AIAnalysisResponse, PlantResponse } from '../schemas';

const analyzeImage = async (imageDataUrl: string): Promise<AIAnalysisResponse> => {
  try {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analiza esta imagen de planta y proporciona la siguiente información en formato JSON:
                {
                  "species": "nombre científico de la especie",
                  "commonName": "nombre común",
                  "confidence": numero_del_0_al_100,
                  "generalDescription": "descripción general de la planta",
                  "funFacts": ["dato curioso 1", "dato curioso 2", "dato curioso 3"],
                  "plantEnvironment": "interior" | "exterior" | "ambos",
                  "lightRequirements": "poca_luz" | "luz_indirecta" | "luz_directa_parcial" | "pleno_sol",
                  "health": {
                    "overallHealth": "excellent" | "good" | "fair" | "poor",
                    "confidence": numero_del_0_al_100,
                    "issues": ["problema 1", "problema 2"],
                    "recommendations": ["recomendación 1", "recomendación 2"]
                  },
                  "careProfile": {
                    "watering": "diario" | "cada_2_dias" | "semanal" | "bisemanal",
                    "sunlight": "directo" | "indirecto" | "sombra",
                    "humidity": "alta" | "media" | "baja",
                    "temperature": "calida" | "templada" | "fresca",
                    "fertilizing": "mensual" | "bimestral" | "estacional"
                  },
                  "personality": {
                    "energyLevel": "alta" | "media" | "baja",
                    "communicationStyle": "alegre" | "sereno" | "jugueton" | "sabio",
                    "interests": ["interes 1", "interes 2"]
                  },
                  "variety": "variedad específica si aplica"
                }`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI API');
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI API');
    }

  } catch (error) {
    console.error('Error analyzing image with OpenAI:', error);
    throw error;
  }
};

const generatePlantResponse = async (
  message: string,
  plantContext: {
    species?: string;
    name?: string;
    healthScore?: number;
    careProfile?: any;
    personality?: any;
  }
): Promise<PlantResponse> => {
  try {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }

    const systemPrompt = `Eres una planta ${plantContext.species || 'que puede comunicarse'} llamada ${plantContext.name || 'amigable'}. 
    Tu personalidad es ${plantContext.personality?.communicationStyle || 'alegre'} y ${plantContext.personality?.energyLevel || 'media'} energía.
    Tu salud actual es ${plantContext.healthScore || 'buena'}%.
    
    Responde como si fueras esta planta, de manera ${plantContext.personality?.communicationStyle || 'cálida'} y amigable. 
    Comparte consejos de cuidado relevantes cuando sea apropiado.
    Mantén las respuestas entre 50-150 palabras.
    Incluye emojis de plantas cuando sea apropiado.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI API');
    }

    // Detect emotion from response
    const emotions = ['alegre', 'triste', 'enojado', 'neutral', 'juguetón', 'agradecido'];
    const detectedEmotion = emotions.find(emotion => 
      content.toLowerCase().includes(emotion) || 
      content.includes('😊') || content.includes('🌱') ? 'alegre' :
      content.includes('😢') || content.includes('😔') ? 'triste' :
      content.includes('😠') || content.includes('😤') ? 'enojado' :
      content.includes('😄') || content.includes('🎉') ? 'juguetón' :
      content.includes('🙏') || content.includes('gracias') ? 'agradecido' : 'neutral'
    ) || 'alegre';

    return {
      content,
      emotion: detectedEmotion as any,
      mood: plantContext.personality?.communicationStyle || 'friendly'
    };

  } catch (error) {
    console.error('Error generating plant response:', error);
    throw error;
  }
};

const completePlantInfo = async (
  plant: any,
  fields: {
    description?: boolean;
    funFacts?: boolean;
    plantEnvironment?: boolean;
    lightRequirements?: boolean;
  }
): Promise<any> => {
  try {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }

    const fieldsToComplete = Object.entries(fields).filter(([_, should]) => should).map(([field]) => field);
    
    if (fieldsToComplete.length === 0) {
      return {};
    }

    const prompt = `Para la planta ${plant.species} (${plant.name}), proporciona la siguiente información en formato JSON:
    {
      ${fields.description ? '"description": "descripción detallada de la planta",' : ''}
      ${fields.funFacts ? '"funFacts": ["dato curioso 1", "dato curioso 2", "dato curioso 3"],' : ''}
      ${fields.plantEnvironment ? '"plantEnvironment": "interior" | "exterior" | "ambos",' : ''}
      ${fields.lightRequirements ? '"lightRequirements": "poca_luz" | "luz_indirecta" | "luz_directa_parcial" | "pleno_sol"' : ''}
    }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI API');
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI API');
    }

  } catch (error) {
    console.error('Error completing plant info:', error);
    throw error;
  }
};

const updateHealthAnalysis = async (
  plant: any,
  imageUrl: string
): Promise<any> => {
  try {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analiza la salud de esta planta ${plant.species} y proporciona un análisis actualizado en formato JSON:
                {
                  "overallHealth": "excellent" | "good" | "fair" | "poor",
                  "confidence": numero_del_0_al_100,
                  "issues": ["problema 1", "problema 2"],
                  "recommendations": ["recomendación 1", "recomendación 2"],
                  "healthScore": numero_del_0_al_100
                }`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI API');
    }

    try {
      const healthAnalysis = JSON.parse(content);
      return {
        healthAnalysis,
        updatedImage: {
          id: plant.id,
          url: imageUrl,
          healthAnalysis
        }
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI API');
    }

  } catch (error) {
    console.error('Error updating health analysis:', error);
    throw error;
  }
};

export default {
  analyzeImage,
  generatePlantResponse,
  completePlantInfo,
  updateHealthAnalysis,
};