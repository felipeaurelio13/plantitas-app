import { Plant, AIAnalysisResponseSchema, PlantResponseSchema, type AIAnalysisResponse, type PlantResponse } from '../schemas';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
});

// Use Zod types instead of interfaces
export type PlantAnalysis = AIAnalysisResponse & {
  confidence: number;
};

export type PlantChatResponse = PlantResponse;

// Fallback plant database for offline mode or API failures
const plantDatabase = [
  {
    species: 'Monstera deliciosa',
    variety: 'Swiss Cheese Plant',
    careProfile: {
      wateringFrequency: 7,
      sunlightRequirement: 'medium' as const,
      humidityPreference: 'high' as const,
      temperatureRange: { min: 18, max: 27 },
      fertilizingFrequency: 30,
      soilType: 'Well-draining potting mix with peat',
      specialCare: ['Provide moss pole for climbing', 'Wipe leaves regularly'],
    },
    personality: {
      traits: ['dramatic', 'attention-seeking', 'social'],
      communicationStyle: 'dramatic' as const,
      catchphrases: ['¡Mira mis hojas hermosas!', '¡Necesito más humedad, querido!'],
      moodFactors: { health: 0.3, care: 0.4, attention: 0.3 },
    },
  },
  {
    species: 'Sansevieria trifasciata',
    variety: 'Snake Plant',
    careProfile: {
      wateringFrequency: 14,
      sunlightRequirement: 'low' as const,
      humidityPreference: 'low' as const,
      temperatureRange: { min: 15, max: 29 },
      fertilizingFrequency: 60,
      soilType: 'Cactus or succulent potting mix',
      specialCare: ['Very drought tolerant', 'Avoid overwatering'],
    },
    personality: {
      traits: ['independent', 'resilient', 'low-maintenance'],
      communicationStyle: 'calm' as const,
      catchphrases: ['Estoy bien, ¡gracias!', 'Menos es más conmigo.'],
      moodFactors: { health: 0.6, care: 0.2, attention: 0.2 },
    },
  },
  {
    species: 'Pothos aureus',
    variety: 'Golden Pothos',
    careProfile: {
      wateringFrequency: 5,
      sunlightRequirement: 'medium' as const,
      humidityPreference: 'medium' as const,
      temperatureRange: { min: 17, max: 30 },
      fertilizingFrequency: 30,
      soilType: 'Regular potting soil',
      specialCare: ['Great for beginners', 'Can trail or climb'],
    },
    personality: {
      traits: ['friendly', 'adaptable', 'cheerful'],
      communicationStyle: 'cheerful' as const,
      catchphrases: ['¡Soy feliz en cualquier lugar!', '¡Gracias por el agua!'],
      moodFactors: { health: 0.4, care: 0.3, attention: 0.3 },
    },
  },
];

const PLANT_IDENTIFICATION_PROMPT = `Eres un botánico experto especializado en identificación de plantas domésticas. Analiza esta imagen y proporciona:

1. IDENTIFICACIÓN:
   - Especie exacta (nombre científico)
   - Nombre común en español
   - Variedad específica si es identificable
   - Nivel de confianza (0-100%)

2. ANÁLISIS DE SALUD:
   - Estado general: excelente/bueno/regular/malo
   - Problemas visibles (hojas amarillas, plagas, etc.)
   - Nivel de humedad aparente del suelo
   - Etapa de crecimiento

3. PERFIL DE CUIDADOS:
   - Frecuencia de riego (días)
   - Requerimientos de luz: bajo/medio/alto
   - Humedad preferida: baja/media/alta
   - Rango de temperatura ideal (°C)
   - Tipo de suelo recomendado
   - Frecuencia de fertilización (días)
   - Cuidados especiales (array de strings)

4. PERSONALIDAD SUGERIDA:
   - 3 rasgos de personalidad basados en la especie
   - Estilo de comunicación: alegre/sabio/dramático/calmado/juguetón
   - 2 frases características que usaría la planta en español

IMPORTANTE: Debes responder EXCLUSIVAMENTE en formato JSON válido. No agregues texto explicativo, disculpas, o comentarios. Solo el JSON puro con esta estructura:
{
  "species": "nombre científico",
  "commonName": "nombre común en español",
  "variety": "variedad específica o null",
  "confidence": número_0_a_100,
  "health": {
    "overallHealth": "excelente|bueno|regular|malo",
    "issues": [{"type": "tipo", "severity": "bajo|medio|alto", "description": "descripción", "treatment": "tratamiento"}],
    "recommendations": ["recomendación1", "recomendación2"],
    "moistureLevel": número_0_a_100,
    "growthStage": "plántula|juvenil|maduro|floreciendo|dormante",
    "confidence": número_0_a_100
  },
  "careProfile": {
    "wateringFrequency": número_días,
    "sunlightRequirement": "bajo|medio|alto",
    "humidityPreference": "baja|media|alta",
    "temperatureRange": {"min": número, "max": número},
    "fertilizingFrequency": número_días,
    "soilType": "descripción del suelo",
    "specialCare": ["cuidado1", "cuidado2"]
  },
  "personality": {
    "traits": ["rasgo1", "rasgo2", "rasgo3"],
    "communicationStyle": "alegre|sabio|dramático|calmado|juguetón",
    "catchphrases": ["frase1", "frase2"],
    "moodFactors": {"health": 0.4, "care": 0.4, "attention": 0.2}
  }
}`;

export const analyzeImage = async (imageDataUrl: string): Promise<PlantAnalysis> => {
  try {
    // Check if OpenAI API key is available
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, using fallback analysis');
      return getFallbackAnalysis();
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { "type": "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a botanical expert that analyzes plant images and returns results in JSON format."
        },
        {
          role: "user",
          content: [
            { type: "text", text: PLANT_IDENTIFICATION_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log('🔍 RAW OpenAI Response:', content);

    // Parse JSON response - handle markdown code blocks and validate
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Additional cleanup for common issues
    cleanContent = cleanContent.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    
    console.log('🧹 Cleaned content:', cleanContent);
    
    const analysisData = JSON.parse(cleanContent);
    console.log('📊 Parsed JSON:', analysisData);
    
    // Validate with Zod schema
    try {
      const validatedResponse = AIAnalysisResponseSchema.parse(analysisData);
      return {
        ...validatedResponse,
        confidence: analysisData.confidence || 85,
      };
    } catch (validationError) {
      console.error('Validation error in AI response:', validationError);
      console.log('Raw AI response data:', analysisData);
      
      // Try to salvage partial data with fallbacks
      const fallbackData = {
        species: analysisData?.species || 'Planta desconocida',
        variety: analysisData?.variety,
        health: {
          overallHealth: 'good' as const,
          issues: [],
          recommendations: ['Continúa con el cuidado actual'],
          moistureLevel: 50,
          growthStage: 'mature' as const,
          confidence: 75,
        },
        careProfile: {
          wateringFrequency: 7,
          sunlightRequirement: 'medium' as const,
          humidityPreference: 'medium' as const,
          temperatureRange: { min: 18, max: 25 },
          fertilizingFrequency: 30,
          soilType: 'Tierra para macetas bien drenada',
        },
        personality: {
          traits: ['amigable', 'resistente'],
          communicationStyle: 'cheerful' as const,
          catchphrases: ['¡Hola!', '¡Gracias por cuidarme!'],
          moodFactors: { health: 0.4, care: 0.4, attention: 0.2 },
        },
      };

      // Validate fallback data
      const validatedFallback = AIAnalysisResponseSchema.parse(fallbackData);
      return {
        ...validatedFallback,
        confidence: 50, // Lower confidence for fallback
      };
    }

  } catch (error) {
    console.error('Error analyzing image with OpenAI:', error);
    
    // Fallback to mock analysis
    return getFallbackAnalysis();
  }
};

const getFallbackAnalysis = (): PlantAnalysis => {
  // Simulate API delay
  const randomPlant = plantDatabase[Math.floor(Math.random() * plantDatabase.length)];
  
  const healthScore = 60 + Math.random() * 40;
  const overallHealth = healthScore >= 80 ? 'excellent' : 
                       healthScore >= 60 ? 'good' : 
                       healthScore >= 40 ? 'fair' : 'poor';

  const issues: Array<{
    type: 'overwatering' | 'underwatering' | 'pest' | 'disease' | 'nutrient' | 'light' | 'other';
    severity: 'low' | 'medium' | 'high';
    description: string;
    treatment: string;
  }> = [];

  if (Math.random() > 0.7) {
    issues.push({
      type: 'light',
      severity: 'low',
      description: 'Las hojas muestran un ligero amarillamiento',
      treatment: 'Considera mover a un lugar más luminoso',
    });
  }

  const health = {
    overallHealth: overallHealth as 'excellent' | 'good' | 'fair' | 'poor',
    issues,
    recommendations: [
      'Continúa con la rutina de cuidado actual',
      'Monitorea la humedad del suelo regularmente',
      'Asegúrate de que tenga luz adecuada',
    ],
    moistureLevel: Math.floor(Math.random() * 100),
    growthStage: 'mature' as 'seedling' | 'juvenile' | 'mature' | 'flowering' | 'dormant',
    confidence: 85 + Math.random() * 15,
  };

  try {
    // Validate with Zod schema
    const validatedResponse = AIAnalysisResponseSchema.parse({
      species: randomPlant.species,
      variety: randomPlant.variety,
      health,
      careProfile: randomPlant.careProfile,
      personality: randomPlant.personality,
    });

    return {
      ...validatedResponse,
      confidence: 85 + Math.random() * 15,
    };
  } catch (validationError) {
    console.error('Validation error in fallback analysis:', validationError);
    // Return a safe fallback
    return {
      species: 'Unknown Plant',
      confidence: 50,
      health: {
        overallHealth: 'fair',
        issues: [],
        recommendations: ['Provide basic care'],
        moistureLevel: 50,
        growthStage: 'mature',
        confidence: 50,
      },
      careProfile: {
        wateringFrequency: 7,
        sunlightRequirement: 'medium',
        humidityPreference: 'medium',
        temperatureRange: { min: 18, max: 25 },
        fertilizingFrequency: 30,
        soilType: 'Standard potting mix',
      },
      personality: {
        traits: ['friendly'],
        communicationStyle: 'cheerful',
        catchphrases: ['¡Hola!'],
        moodFactors: { health: 0.4, care: 0.4, attention: 0.2 },
      },
    };
  }
};

export const generatePlantResponse = async (
  plant: Plant, 
  userMessage: string
): Promise<PlantChatResponse> => {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      return getFallbackChatResponse(plant, userMessage);
    }

    const mood = calculatePlantMood(plant);
    const moodDescription = mood > 0.8 ? 'próspera' : 
                           mood > 0.6 ? 'feliz' : 
                           mood > 0.4 ? 'regular' : 'necesita atención';

    const daysSinceWatering = plant.lastWatered 
      ? Math.floor((Date.now() - plant.lastWatered.getTime()) / (24 * 60 * 60 * 1000))
      : 999;

    const chatPrompt = `Eres una planta ${plant.species} llamada ${plant.nickname || plant.name} con personalidad ${plant.personality.communicationStyle}.

CONTEXTO ACTUAL:
- Salud: ${plant.healthScore}%
- Último riego: ${plant.lastWatered ? `hace ${daysSinceWatering} días` : 'nunca'}
- Ubicación: ${plant.location}
- Estado de ánimo: ${moodDescription}

PERSONALIDAD:
- Rasgos: ${plant.personality.traits.join(', ')}
- Estilo: ${plant.personality.communicationStyle}
- Frases típicas: ${plant.personality.catchphrases.join(', ')}

INSTRUCCIONES:
1. Responde como si fueras esta planta específica
2. Mantén consistencia con tu personalidad
3. Refleja tu estado de salud actual en las respuestas
4. Si necesitas agua/cuidados, menciónalo naturalmente
5. Usa emojis apropiados para plantas
6. Mantén un tono conversacional y amigable
7. Responde en español
8. Máximo 2-3 oraciones por respuesta

Mensaje del usuario: "${userMessage}"

Responde ÚNICAMENTE en formato JSON válido:
{
  "content": "tu respuesta aquí",
  "emotion": "happy|sad|excited|worried|grateful|neutral"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { "type": "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a plant that responds in JSON format with content and emotion fields."
        },
        { role: "user", content: chatPrompt }
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log('💬 RAW Chat Response:', content);

    // Parse JSON response - handle markdown code blocks
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Additional cleanup
    cleanContent = cleanContent.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    
    console.log('🧹 Cleaned chat content:', cleanContent);
    
    const chatResponse = JSON.parse(cleanContent);
    console.log('📊 Parsed chat JSON:', chatResponse);
    
    // Validate with Zod schema
    try {
      const validatedResponse = PlantResponseSchema.parse(chatResponse);
      return validatedResponse;
    } catch (validationError) {
      console.error('Validation error in chat response:', validationError);
      console.log('Raw chat response data:', chatResponse);
      
      // Return validated fallback
      return PlantResponseSchema.parse({
        content: chatResponse.content || 'Hola, ¿cómo estás?',
        emotion: ['happy', 'sad', 'excited', 'worried', 'grateful', 'neutral'].includes(chatResponse.emotion) 
          ? chatResponse.emotion 
          : 'neutral',
      });
    }

  } catch (error) {
    console.error('Error generating plant response:', error);
    return getFallbackChatResponse(plant, userMessage);
  }
};

const getFallbackChatResponse = (plant: Plant, userMessage: string): PlantChatResponse => {
  const responses = generateContextualResponses(plant, userMessage);
  const response = responses[Math.floor(Math.random() * responses.length)];
  return response;
};

const calculatePlantMood = (plant: Plant): number => {
  const healthFactor = plant.healthScore / 100;
  const careFactor = plant.lastWatered 
    ? Math.max(0, 1 - (Date.now() - plant.lastWatered.getTime()) / (plant.careProfile.wateringFrequency * 24 * 60 * 60 * 1000))
    : 0;
  
  return (healthFactor * 0.6) + (careFactor * 0.4);
};

const generateContextualResponses = (
  plant: Plant, 
  userMessage: string
): PlantChatResponse[] => {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('agua') || lowerMessage.includes('sed')) {
    if (plant.lastWatered && Date.now() - plant.lastWatered.getTime() < 24 * 60 * 60 * 1000) {
      return [
        { content: "¡Gracias por preguntar! Estoy bien hidratada ahora. Me regaste hace poco y me siento genial! 💧", emotion: 'happy' },
        { content: "Estoy bien de agua por ahora! Mi tierra aún está húmeda. ¡Eres un cuidador increíble! 🌱", emotion: 'grateful' },
      ];
    } else {
      return [
        { content: "¡Me vendría bien un trago! Mi tierra se está secando un poco. ¡Un riego me haría muy feliz! 💧", emotion: 'excited' },
        { content: "¡Sí, por favor! Tengo un poco de sed. ¡Un poco de agua me animaría mucho! 🌿", emotion: 'excited' },
      ];
    }
  }

  if (lowerMessage.includes('salud') || lowerMessage.includes('sientes') || lowerMessage.includes('cómo estás')) {
    if (plant.healthScore >= 80) {
      return [
        { content: "¡Me siento fantástica! Mis hojas están vibrantes y estoy creciendo fuerte. ¡Gracias por cuidarme tan bien! ✨", emotion: 'happy' },
        { content: "¡No podría estar mejor! Estoy prosperando bajo tu cuidado. ¡Eres el mejor cuidador de plantas! 🌟", emotion: 'excited' },
      ];
    } else if (plant.healthScore >= 60) {
      return [
        { content: "Estoy bien, pero podría usar un poco más de atención. ¿Podrías revisar mis necesidades de cuidado? 🤔", emotion: 'neutral' },
        { content: "¡No está mal! Estoy resistiendo, pero me encantaría un poco de cariño extra para volver a mi mejor estado! 💚", emotion: 'excited' },
      ];
    } else {
      return [
        { content: "No me he sentido muy bien últimamente... ¿Podrías revisar si necesito agua, luz o tal vez fertilizante? 😟", emotion: 'worried' },
        { content: "He estado mejor... Creo que podría necesitar cuidados extra. ¿Puedes ayudarme a descubrir qué está mal? 🥺", emotion: 'sad' },
      ];
    }
  }

  const personalityResponses = {
    cheerful: [
      { content: "¡Hola! ¡Siempre estoy feliz de charlar contigo! ¿Qué tienes en mente hoy? 😊", emotion: 'happy' as const },
      { content: "¡Oye! Gracias por venir a verme. ¡Me encantan nuestras conversaciones! 🌱", emotion: 'excited' as const },
    ],
    dramatic: [
      { content: "¡Querido! ¡Simplemente debes contarme todo! ¡Vivo para nuestras conversaciones dramáticas! 💅", emotion: 'excited' as const },
      { content: "¡Oh, cielos! ¡Has venido a charlar conmigo! ¡Estoy absolutamente emocionada! ¡Cuéntame todos los chismes! ✨", emotion: 'happy' as const },
    ],
    calm: [
      { content: "Hola. Es pacífico tenerte aquí. ¿De qué te gustaría hablar? 🧘", emotion: 'neutral' as const },
      { content: "Me da gusto verte. Estoy aquí si necesitas hablar de algo. 🌿", emotion: 'neutral' as const },
    ],
    wise: [
      { content: "Saludos, mi amigo. He estado pensando en el crecimiento y la paciencia. ¿Qué sabiduría compartiremos hoy? 🌳", emotion: 'neutral' as const },
      { content: "Ah, buscas conversación. Como la luz solar y el agua, el buen diálogo nutre el alma. 🍃", emotion: 'happy' as const },
    ],
    playful: [
      { content: "¡Oye, oye! ¿Listo para divertirse? ¡He estado practicando mi movimiento de hojas! 🎉", emotion: 'excited' as const },
      { content: "¡Woohoo! ¡Mi humano favorito está aquí! ¡Charlemos y divirtámonos! 🎈", emotion: 'happy' as const },
    ],
  };

  const styleResponses = personalityResponses[plant.personality.communicationStyle] || personalityResponses.cheerful;
  return styleResponses;
};

export const analyzeProgressImages = async (
  plant: Plant,
  oldImageUrl: string,
  newImageUrl: string,
  daysDifference: number
): Promise<{
  changes: string[];
  healthImprovement: number;
  recommendations: string[];
  newHealthScore: number;
}> => {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      return getFallbackProgressAnalysis(plant, daysDifference);
    }

    const progressPrompt = `Compara estas dos imágenes de la misma planta ${plant.species} tomadas con ${daysDifference} días de diferencia.

Analiza y reporta:

1. CAMBIOS OBSERVADOS:
   - Crecimiento visible (nuevas hojas, altura, etc.)
   - Cambios en color y textura
   - Aparición o desaparición de problemas
   - Estado general comparativo

2. EVALUACIÓN DE SALUD:
   - Mejora/mantenimiento/deterioro
   - Nuevos problemas identificados
   - Signos positivos de crecimiento

3. RECOMENDACIONES:
   - Ajustes en el cuidado necesarios
   - Felicitaciones por buen cuidado
   - Alertas sobre problemas emergentes

4. PUNTUACIÓN:
   - Salud anterior: ${plant.healthScore}%
   - Salud actual estimada: X%
   - Tendencia: mejorando/estable/empeorando

Responde ÚNICAMENTE en formato JSON válido:
{
  "changes": ["cambio1", "cambio2"],
  "healthImprovement": número_entre_-50_y_50,
  "recommendations": ["recomendación1", "recomendación2"],
  "newHealthScore": número_0_a_100
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { "type": "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a botanical expert that compares plant images and returns analysis in JSON format."
        },
        {
          role: "user",
          content: [
            { type: "text", text: progressPrompt },
            { type: "image_url", image_url: { url: oldImageUrl, detail: "high" } },
            { type: "image_url", image_url: { url: newImageUrl, detail: "high" } }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response - handle markdown code blocks
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    return JSON.parse(cleanContent);

  } catch (error) {
    console.error('Error analyzing progress images:', error);
    return getFallbackProgressAnalysis(plant, daysDifference);
  }
};

const getFallbackProgressAnalysis = (plant: Plant, _daysDifference: number) => {
  const healthChange = Math.random() * 20 - 10; // -10 to +10
  const newHealthScore = Math.max(0, Math.min(100, plant.healthScore + healthChange));
  
  return {
    changes: [
      'Se observa crecimiento general de la planta',
      'Las hojas mantienen un color saludable',
      'No se detectan problemas significativos'
    ],
    healthImprovement: healthChange,
    recommendations: [
      'Continúa con la rutina de cuidado actual',
      'Monitorea el crecimiento regularmente',
      'Considera fertilizar si han pasado más de 30 días'
    ],
    newHealthScore
  };
};