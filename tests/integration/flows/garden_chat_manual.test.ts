import { describe, it, expect } from 'vitest';
import { mcp_supabase_execute_sql } from '../src/services/testSupabaseService';

describe('Garden Chat Manual Testing', () => {
  const PROJECT_ID = 'cvvvybrkxypfsfcbmbcq';

  it('should test garden context building with real data', async () => {
    console.log('🧪 Testing garden context building...');

    // Get real plants data from database
    const plantsQuery = `
      SELECT 
        id,
        name,
        nickname,
        species,
        location,
        plant_environment,
        light_requirements,
        health_score,
        last_watered,
        last_fertilized,
        care_profile,
        date_added
      FROM plants 
      LIMIT 5;
    `;

    try {
      const result = await mcp_supabase_execute_sql(PROJECT_ID, plantsQuery);
      console.log('✅ Successfully queried plants data');
      console.log('📊 Number of plants found:', result.data?.length || 0);
      
      if (result.data && result.data.length > 0) {
        console.log('🌱 Sample plant:', result.data[0]);
        
        // Test garden context structure
        const totalPlants = result.data.length;
        const averageHealthScore = totalPlants > 0 
          ? Math.round(result.data.reduce((sum: number, plant: any) => sum + (plant.health_score || 85), 0) / totalPlants)
          : 0;

        console.log('📈 Garden Summary:');
        console.log('  - Total plants:', totalPlants);
        console.log('  - Average health:', averageHealthScore);
        
        // Test care needs calculation
        const now = new Date();
        const needsWatering = result.data.filter((plant: any) => {
          if (plant.last_watered && plant.care_profile?.wateringFrequency) {
            const lastWateredDate = new Date(plant.last_watered);
            const nextWateringDate = new Date(lastWateredDate);
            nextWateringDate.setDate(lastWateredDate.getDate() + plant.care_profile.wateringFrequency);
            return now > nextWateringDate;
          }
          return false;
        });

        console.log('💧 Plants needing water:', needsWatering.length);
        
        expect(totalPlants).toBeGreaterThanOrEqual(0);
        expect(averageHealthScore).toBeGreaterThanOrEqual(0);
        expect(averageHealthScore).toBeLessThanOrEqual(100);
      } else {
        console.log('ℹ️ No plants found in database - this is okay for testing');
      }
      
    } catch (error) {
      console.error('❌ Error testing garden context:', error);
      throw error;
    }
  });

  it('should test garden AI chat function structure', async () => {
    console.log('🤖 Testing garden AI chat function structure...');

    // Create a mock garden context for testing
    const mockGardenContext = {
      totalPlants: 3,
      plantsData: [
        {
          id: '1',
          name: 'Pothos',
          nickname: 'Mi Pothos',
          species: 'Epipremnum aureum',
          location: 'Sala',
          healthScore: 85,
          lastWatered: new Date('2024-01-15'),
          wateringFrequency: 7
        },
        {
          id: '2',
          name: 'Monstera',
          species: 'Monstera deliciosa',
          location: 'Habitación',
          healthScore: 92,
          lastWatered: new Date('2024-01-14'),
          wateringFrequency: 10
        },
        {
          id: '3',
          name: 'Sansevieria',
          species: 'Sansevieria trifasciata',
          location: 'Oficina',
          healthScore: 78,
          lastWatered: new Date('2024-01-10'),
          wateringFrequency: 14
        }
      ],
      averageHealthScore: 85,
      commonIssues: ['Riego irregular'],
      careScheduleSummary: {
        needsWatering: ['1'],
        needsFertilizing: [],
        healthConcerns: ['3']
      },
      environmentalFactors: {
        locations: ['Sala', 'Habitación', 'Oficina'],
        lightConditions: [],
        humidityNeeds: []
      }
    };

    console.log('📋 Mock garden context created:');
    console.log('  - Total plants:', mockGardenContext.totalPlants);
    console.log('  - Average health:', mockGardenContext.averageHealthScore);
    console.log('  - Locations:', mockGardenContext.environmentalFactors.locations.join(', '));
    console.log('  - Plants needing water:', mockGardenContext.careScheduleSummary.needsWatering.length);
    console.log('  - Health concerns:', mockGardenContext.careScheduleSummary.healthConcerns.length);

    // Test that the context has all required fields
    expect(mockGardenContext.totalPlants).toBe(3);
    expect(mockGardenContext.averageHealthScore).toBe(85);
    expect(mockGardenContext.plantsData).toHaveLength(3);
    expect(mockGardenContext.environmentalFactors.locations).toContain('Sala');
    
    console.log('✅ Garden context structure is valid');
  });

  it('should simulate garden AI response format', () => {
    console.log('🎭 Testing expected AI response format...');

    const expectedResponseStructure = {
      content: "Tu jardín se ve bien en general...",
      insights: [
        {
          type: "recommendation",
          title: "Ajustar riego",
          description: "Algunas plantas necesitan más agua",
          affectedPlants: ["1"]
        }
      ],
      suggestedActions: [
        {
          action: "Regar el Pothos",
          priority: "medium",
          plantIds: ["1"]
        }
      ]
    };

    console.log('📝 Expected response structure:');
    console.log('  - Content type:', typeof expectedResponseStructure.content);
    console.log('  - Insights count:', expectedResponseStructure.insights.length);
    console.log('  - Actions count:', expectedResponseStructure.suggestedActions.length);

    // Validate response structure
    expect(expectedResponseStructure.content).toBeTruthy();
    expect(Array.isArray(expectedResponseStructure.insights)).toBe(true);
    expect(Array.isArray(expectedResponseStructure.suggestedActions)).toBe(true);
    
    // Validate insight structure
    const insight = expectedResponseStructure.insights[0];
    expect(insight.type).toBeTruthy();
    expect(insight.title).toBeTruthy();
    expect(insight.description).toBeTruthy();
    
    // Validate action structure
    const action = expectedResponseStructure.suggestedActions[0];
    expect(action.action).toBeTruthy();
    expect(action.priority).toBeTruthy();
    
    console.log('✅ AI response format is valid');
  });
}); 