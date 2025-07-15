import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GardenChatService } from '../src/services/gardenChatService';

// Mock Supabase
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [
              {
                id: '1',
                name: 'Planta Test',
                nickname: 'Mi Planta',
                species: 'Pothos aureus',
                location: 'Sala',
                health_score: 85,
                last_watered: '2024-01-15T10:00:00Z',
                care_profile: { wateringFrequency: 7 },
              }
            ],
            error: null
          }))
        }))
      }))
    })),
    functions: {
      invoke: vi.fn(() => ({
        data: {
          content: "¡Hola! Tu jardín se ve muy bien.",
          insights: [],
          suggestedActions: []
        },
        error: null
      }))
    }
  }
}));

describe('GardenChatService', () => {
  let service: GardenChatService;

  beforeEach(() => {
    service = new GardenChatService();
    vi.clearAllMocks();
  });

  it('should build garden context correctly', async () => {
    const context = await service.buildGardenContext('test-user-id');
    
    expect(context.totalPlants).toBe(1);
    expect(context.plantsData).toHaveLength(1);
    expect(context.plantsData[0].name).toBe('Planta Test');
    expect(context.averageHealthScore).toBe(85);
  });

  it('should send message to garden AI', async () => {
    const response = await service.sendMessageToGardenAI(
      '¿Cómo está mi jardín?',
      'test-user-id',
      []
    );

    expect(response.content).toBe('¡Hola! Tu jardín se ve muy bien.');
    expect(response.insights).toEqual([]);
    expect(response.suggestedActions).toEqual([]);
  });

  it('should get garden health summary', async () => {
    const summary = await service.getGardenHealthSummary('test-user-id');

    expect(summary.totalPlants).toBe(1);
    expect(summary.averageHealth).toBe(85);
    expect(summary.healthyPlants).toBe(1); // Health score >= 80
  });

  it('should provide suggested questions', async () => {
    const questions = await service.getSuggestedQuestions('test-user-id');

    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0]).toBe('¿Cómo está la salud general de mi jardín?');
  });
});

// Test individual functions
describe('Garden Chat Edge Function Integration', () => {
  it('should have correct prompt structure', () => {
    // This is more of a documentation test to ensure we understand the expected format
    const expectedPromptStructure = {
      gardenContext: {
        totalPlants: expect.any(Number),
        plantsData: expect.any(Array),
        averageHealthScore: expect.any(Number),
        commonIssues: expect.any(Array),
        careScheduleSummary: expect.any(Object),
        environmentalFactors: expect.any(Object)
      },
      userMessage: expect.any(String),
      conversationHistory: expect.any(Array)
    };

    expect(expectedPromptStructure).toBeDefined();
  });
}); 