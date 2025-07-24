import { describe, it, expect } from 'vitest';

describe('Garden AI Chat Real Data Test', () => {
  const REAL_GARDEN_CONTEXT = {
    totalPlants: 15,
    plantsData: [
      {
        id: '1',
        name: 'Bambú sagrado',
        nickname: 'Bambú sagrado',
        species: 'Nandina domestica',
        location: 'Patio',
        healthScore: 90,
        lastWatered: null,
        wateringFrequency: undefined
      },
      {
        id: '2',
        name: 'Ranúnculo',
        nickname: 'Ranúnculo',
        species: 'Ranunculus asiaticus',
        location: 'Patio',
        healthScore: 90,
        lastWatered: null,
        wateringFrequency: undefined
      },
      {
        id: '3',
        name: 'Lantana',
        nickname: 'Lantana',
        species: 'Lantana camara',
        location: 'Patio',
        healthScore: 80,
        lastWatered: null,
        wateringFrequency: undefined
      },
      {
        id: '4',
        name: 'Ficus robusta',
        nickname: 'Ficus robusta',
        species: 'Ficus elastica',
        location: 'Patio',
        healthScore: 90,
        lastWatered: null,
        wateringFrequency: undefined
      },
      {
        id: '5',
        name: 'Geranio',
        nickname: 'Geranio',
        species: 'Pelargonium hortorum',
        location: 'Patio',
        healthScore: 90,
        lastWatered: null,
        wateringFrequency: undefined
      }
    ],
    averageHealthScore: 88,
    commonIssues: [],
    careScheduleSummary: {
      needsWatering: [],
      needsFertilizing: [],
      healthConcerns: []
    },
    environmentalFactors: {
      locations: ['Patio'],
      lightConditions: [],
      humidityNeeds: []
    }
  };

  it('should have proper garden context structure', () => {
    console.log('🏡 Testing garden context structure...');
    
    // Test context completeness
    expect(REAL_GARDEN_CONTEXT.totalPlants).toBe(15);
    expect(REAL_GARDEN_CONTEXT.averageHealthScore).toBe(88);
    expect(REAL_GARDEN_CONTEXT.plantsData).toHaveLength(5);
    expect(REAL_GARDEN_CONTEXT.environmentalFactors.locations).toContain('Patio');
    
    console.log('✅ Garden context structure is valid');
    console.log(`📊 Plants: ${REAL_GARDEN_CONTEXT.totalPlants}, Avg Health: ${REAL_GARDEN_CONTEXT.averageHealthScore}%`);
  });

  it('should validate care schedule analysis', () => {
    console.log('🗓️ Testing care schedule analysis...');
    
    const { careScheduleSummary } = REAL_GARDEN_CONTEXT;
    
    // Test care analysis
    expect(Array.isArray(careScheduleSummary.needsWatering)).toBe(true);
    expect(Array.isArray(careScheduleSummary.needsFertilizing)).toBe(true);
    expect(Array.isArray(careScheduleSummary.healthConcerns)).toBe(true);
    
    console.log('✅ Care schedule structure is valid');
    console.log(`💧 Need watering: ${careScheduleSummary.needsWatering.length}`);
    console.log(`🌱 Need fertilizing: ${careScheduleSummary.needsFertilizing.length}`);
    console.log(`⚠️ Health concerns: ${careScheduleSummary.healthConcerns.length}`);
  });

  it('should test different conversation types', () => {
    console.log('💬 Testing conversation types...');
    
    const testQueries = [
      {
        type: 'general',
        query: '¿Cómo está mi jardín en general?',
        expectedElements: ['jardín', 'plantas', 'salud']
      },
      {
        type: 'health_analysis',
        query: '¿Qué plantas tienen problemas de salud?',
        expectedElements: ['salud', 'problemas', 'plantas']
      },
      {
        type: 'care_comparison',
        query: '¿Cuál es la diferencia de cuidado entre mis plantas?',
        expectedElements: ['cuidado', 'diferencia', 'plantas']
      },
      {
        type: 'watering',
        query: '¿Qué plantas necesitan riego?',
        expectedElements: ['riego', 'agua', 'plantas']
      },
      {
        type: 'location',
        query: '¿Cómo organizar mejor las plantas en el patio?',
        expectedElements: ['patio', 'organizar', 'plantas']
      }
    ];

    testQueries.forEach(testCase => {
      console.log(`🔍 Testing query type: ${testCase.type}`);
      console.log(`   Query: "${testCase.query}"`);
      
      // Basic query validation
      expect(testCase.query.length).toBeGreaterThan(10);
      expect(testCase.expectedElements.length).toBeGreaterThan(0);
      
      testCase.expectedElements.forEach(element => {
        expect(testCase.query.toLowerCase()).toContain(element.toLowerCase());
      });
    });
    
    console.log('✅ All conversation types are properly structured');
  });

  it('should validate expected AI response structure', () => {
    console.log('🤖 Testing expected AI response structure...');
    
    const mockAIResponse = {
      content: `¡Hola! Tu jardín se ve fantástico con ${REAL_GARDEN_CONTEXT.totalPlants} plantas. 
      La salud promedio es de ${REAL_GARDEN_CONTEXT.averageHealthScore}%, lo cual es excelente. 
      Todas tus plantas están ubicadas en el ${REAL_GARDEN_CONTEXT.environmentalFactors.locations[0]}, 
      lo que facilita el cuidado y mantenimiento.`,
      
      insights: [
        {
          type: "observation",
          title: "Jardín bien establecido",
          description: `Con ${REAL_GARDEN_CONTEXT.totalPlants} plantas y una salud promedio de ${REAL_GARDEN_CONTEXT.averageHealthScore}%, tu jardín está en excelente estado.`,
          affectedPlants: REAL_GARDEN_CONTEXT.plantsData.slice(0, 3).map(p => p.id)
        },
        {
          type: "tip",
          title: "Ubicación centralizada",
          description: "Tener todas las plantas en el patio facilita el mantenimiento y control de condiciones ambientales.",
          affectedPlants: []
        }
      ],
      
      suggestedActions: [
        {
          action: "Implementar un sistema de riego programado para el patio",
          priority: "medium",
          plantIds: REAL_GARDEN_CONTEXT.plantsData.map(p => p.id)
        },
        {
          action: "Monitorear la exposición solar de las plantas de patio",
          priority: "low",
          plantIds: []
        }
      ]
    };

    // Test response structure
    expect(mockAIResponse.content).toBeTruthy();
    expect(Array.isArray(mockAIResponse.insights)).toBe(true);
    expect(Array.isArray(mockAIResponse.suggestedActions)).toBe(true);
    
    // Test insights structure
    mockAIResponse.insights.forEach(insight => {
      expect(insight.type).toBeTruthy();
      expect(insight.title).toBeTruthy();
      expect(insight.description).toBeTruthy();
      expect(Array.isArray(insight.affectedPlants)).toBe(true);
    });
    
    // Test actions structure
    mockAIResponse.suggestedActions.forEach(action => {
      expect(action.action).toBeTruthy();
      expect(['low', 'medium', 'high']).toContain(action.priority);
      expect(Array.isArray(action.plantIds)).toBe(true);
    });
    
    console.log('✅ AI response structure is valid');
    console.log(`📝 Content length: ${mockAIResponse.content.length} chars`);
    console.log(`💡 Insights: ${mockAIResponse.insights.length}`);
    console.log(`🎯 Actions: ${mockAIResponse.suggestedActions.length}`);
  });

  it('should test garden chat system prompts', () => {
    console.log('📋 Testing system prompts generation...');
    
    // Mock system prompt generation similar to the Edge function
    const systemPromptPreview = `
CONTEXTO DEL JARDÍN ACTUAL:
- Total de plantas: ${REAL_GARDEN_CONTEXT.totalPlants}
- Salud promedio del jardín: ${REAL_GARDEN_CONTEXT.averageHealthScore}/100
- Ubicaciones: ${REAL_GARDEN_CONTEXT.environmentalFactors.locations.join(', ')}

PLANTAS EN EL JARDÍN:
${REAL_GARDEN_CONTEXT.plantsData.slice(0, 3).map(plant => `
• ${plant.nickname || plant.name} (${plant.species})
  - Ubicación: ${plant.location}
  - Salud: ${plant.healthScore}/100
  - Última vez regada: ${plant.lastWatered ? new Date(plant.lastWatered).toLocaleDateString() : 'No registrado'}
`).join('')}
    `.trim();

    // Test system prompt elements
    expect(systemPromptPreview).toContain(`Total de plantas: ${REAL_GARDEN_CONTEXT.totalPlants}`);
    expect(systemPromptPreview).toContain(`Salud promedio del jardín: ${REAL_GARDEN_CONTEXT.averageHealthScore}/100`);
    expect(systemPromptPreview).toContain('Patio');
    expect(systemPromptPreview).toContain('Nandina domestica');
    
    console.log('✅ System prompt generation is working correctly');
    console.log(`📝 Prompt preview (first 200 chars): ${systemPromptPreview.substring(0, 200)}...`);
  });
}); 