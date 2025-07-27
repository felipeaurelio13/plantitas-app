import { Plant } from '../schemas';

interface PlantInsight {
  type: 'warning' | 'tip' | 'observation' | 'recommendation';
  title: string;
  description: string;
  affectedPlants?: string[];
}

const generateInsights = async (plant: Plant): Promise<PlantInsight[]> => {
  try {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
      console.warn('OpenAI API key not configured. Returning empty insights.');
      return [];
    }

    // Prepare plant context for analysis
    const plantContext = {
      name: plant.name,
      species: plant.species,
      healthScore: plant.healthScore,
      location: plant.location,
      careProfile: plant.careProfile,
      lastWatered: plant.lastWatered,
      lastFertilized: plant.lastFertilized,
      dateAdded: plant.dateAdded,
      recentImages: plant.images?.slice(-3) || [],
      chatHistory: plant.chatMessages?.slice(-5) || []
    };

    const prompt = `Analiza esta planta y genera insights útiles en formato JSON:

    Planta: ${plantContext.name} (${plantContext.species})
    Ubicación: ${plantContext.location}
    Salud actual: ${plantContext.healthScore}%
    Último riego: ${plantContext.lastWatered || 'No registrado'}
    Última fertilización: ${plantContext.lastFertilized || 'No registrado'}
    
    Genera un array de insights con el formato:
    [
      {
        "type": "warning" | "tip" | "observation" | "recommendation",
        "title": "Título breve del insight",
        "description": "Descripción detallada del insight",
        "affectedPlants": ["${plant.id}"]
      }
    ]
    
    Incluye insights sobre:
    - Patrones de cuidado
    - Tendencias de salud
    - Recomendaciones estacionales
    - Optimizaciones de cuidado
    
    Máximo 5 insights. Sé específico y útil.`;

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
        max_tokens: 800,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.warn('No content received from OpenAI API for insights');
      return [];
    }

    try {
      const insights = JSON.parse(content);
      return Array.isArray(insights) ? insights : [];
    } catch (parseError) {
      console.error('Failed to parse OpenAI insights response:', content);
      return [];
    }

  } catch (error) {
    console.error('Error generating insights:', error);
    return [];
  }
};

const generateGardenInsights = async (plants: Plant[]): Promise<PlantInsight[]> => {
  try {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
      console.warn('OpenAI API key not configured. Returning empty garden insights.');
      return [];
    }

    if (plants.length === 0) {
      return [];
    }

    // Prepare garden context
    const gardenSummary = {
      totalPlants: plants.length,
      averageHealth: plants.reduce((sum, p) => sum + (p.healthScore || 0), 0) / plants.length,
      species: [...new Set(plants.map(p => p.species))],
      locations: [...new Set(plants.map(p => p.location))],
      plantsByLocation: plants.reduce((acc, plant) => {
        acc[plant.location] = (acc[plant.location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      healthyPlants: plants.filter(p => (p.healthScore || 0) > 80).length,
      needsAttention: plants.filter(p => (p.healthScore || 0) < 60).length
    };

    const prompt = `Analiza este jardín y genera insights útiles en formato JSON:

    Resumen del jardín:
    - Total de plantas: ${gardenSummary.totalPlants}
    - Salud promedio: ${gardenSummary.averageHealth.toFixed(1)}%
    - Especies: ${gardenSummary.species.join(', ')}
    - Ubicaciones: ${gardenSummary.locations.join(', ')}
    - Plantas saludables: ${gardenSummary.healthyPlants}
    - Necesitan atención: ${gardenSummary.needsAttention}
    
    Genera un array de insights con el formato:
    [
      {
        "type": "warning" | "tip" | "observation" | "recommendation",
        "title": "Título breve del insight",
        "description": "Descripción detallada del insight",
        "affectedPlants": ["id1", "id2"] // IDs de plantas afectadas si aplica
      }
    ]
    
    Incluye insights sobre:
    - Tendencias generales del jardín
    - Recomendaciones de cuidado grupal
    - Optimizaciones de ubicación
    - Alertas de plantas que necesitan atención
    - Patrones estacionales
    
    Máximo 7 insights. Sé específico y útil.`;

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
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.warn('No content received from OpenAI API for garden insights');
      return [];
    }

    try {
      const insights = JSON.parse(content);
      return Array.isArray(insights) ? insights : [];
    } catch (parseError) {
      console.error('Failed to parse OpenAI garden insights response:', content);
      return [];
    }

  } catch (error) {
    console.error('Error generating garden insights:', error);
    return [];
  }
};

const generateSeasonalRecommendations = async (plants: Plant[]): Promise<PlantInsight[]> => {
  try {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiApiKey || openaiApiKey === 'demo-openai-key') {
      console.warn('OpenAI API key not configured. Returning empty seasonal recommendations.');
      return [];
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentSeason = currentMonth >= 3 && currentMonth <= 5 ? 'primavera' :
                         currentMonth >= 6 && currentMonth <= 8 ? 'verano' :
                         currentMonth >= 9 && currentMonth <= 11 ? 'otoño' : 'invierno';

    const plantSpecies = [...new Set(plants.map(p => p.species))];

    const prompt = `Genera recomendaciones estacionales para estas plantas en ${currentSeason}:

    Especies: ${plantSpecies.join(', ')}
    Total de plantas: ${plants.length}
    Estación actual: ${currentSeason}
    
    Genera un array de recomendaciones estacionales en formato JSON:
    [
      {
        "type": "recommendation",
        "title": "Título de la recomendación estacional",
        "description": "Descripción detallada de qué hacer en ${currentSeason}",
        "affectedPlants": [] // Deja vacío para recomendaciones generales
      }
    ]
    
    Incluye recomendaciones sobre:
    - Riego estacional
    - Fertilización apropiada
    - Ubicación y luz
    - Preparación para cambios de estación
    - Cuidados preventivos
    
    Máximo 4 recomendaciones específicas para ${currentSeason}.`;

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
        max_tokens: 600,
        temperature: 0.6
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.warn('No content received from OpenAI API for seasonal recommendations');
      return [];
    }

    try {
      const recommendations = JSON.parse(content);
      return Array.isArray(recommendations) ? recommendations : [];
    } catch (parseError) {
      console.error('Failed to parse OpenAI seasonal recommendations response:', content);
      return [];
    }

  } catch (error) {
    console.error('Error generating seasonal recommendations:', error);
    return [];
  }
};

export {
  generateInsights,
  generateGardenInsights,
  generateSeasonalRecommendations
};

export default {
  generateInsights,
  generateGardenInsights,
  generateSeasonalRecommendations
}; 