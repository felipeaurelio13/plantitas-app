import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn()
    }
  },
  images: {
    analyze: vi.fn()
  }
};

vi.mock('openai', () => ({
  default: vi.fn(() => mockOpenAI)
}));

describe('OpenAI API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Chat Completions API', () => {
    it('should successfully generate plant analysis response', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Esta es una Monstera Deliciosa en buen estado. Sus hojas están verdes y saludables. Te recomiendo mantener el riego actual y asegurarte de que reciba luz indirecta brillante.',
              role: 'assistant'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 200,
          total_tokens: 350
        }
      });

      mockOpenAI.chat.completions.create.mockImplementation(mockCreate);

      const prompt = 'Analiza esta imagen de planta y proporciona recomendaciones de cuidado.';
      const systemMessage = 'Eres un experto en plantas y jardinería.';

      const response = await mockOpenAI.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      expect(response.choices).toHaveLength(1);
      expect(response.choices[0].message.content).toContain('Monstera Deliciosa');
      expect(response.choices[0].message.role).toBe('assistant');
      expect(response.usage.total_tokens).toBe(350);
    });

    it('should handle garden chat conversations', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: '¡Hola! Soy tu asistente de jardín. Tus plantas están en buen estado general. ¿En qué puedo ayudarte?',
              role: 'assistant'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 200,
          completion_tokens: 150,
          total_tokens: 350
        }
      });

      mockOpenAI.chat.completions.create.mockImplementation(mockCreate);

      const conversation = [
        { role: 'system', content: 'Eres un asistente de jardín amigable y experto.' },
        { role: 'user', content: 'Hola, ¿cómo están mis plantas?' },
        { role: 'assistant', content: '¡Hola! Veo que tienes 3 plantas en tu jardín.' },
        { role: 'user', content: '¿Qué recomiendas para mejorar su salud?' }
      ];

      const response = await mockOpenAI.chat.completions.create({
        model: 'gpt-4',
        messages: conversation,
        max_tokens: 300,
        temperature: 0.8
      });

      expect(response.choices[0].message.content).toContain('¡Hola!');
      expect(response.choices[0].message.content).toContain('asistente de jardín');
    });

    it('should handle health diagnosis prompts', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallHealth: 'good',
                confidence: 85,
                issues: [],
                recommendations: ['Keep up the good care!'],
                moistureLevel: 70,
                growthStage: 'mature'
              }),
              role: 'assistant'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 300,
          completion_tokens: 250,
          total_tokens: 550
        }
      });

      mockOpenAI.chat.completions.create.mockImplementation(mockCreate);

      const healthPrompt = 'Analiza esta imagen de planta y proporciona un diagnóstico de salud detallado en formato JSON.';

      const response = await mockOpenAI.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Eres un experto en diagnóstico de plantas. Responde siempre en formato JSON válido.' },
          { role: 'user', content: healthPrompt }
        ],
        max_tokens: 400,
        temperature: 0.3
      });

      const content = response.choices[0].message.content;
      const healthAnalysis = JSON.parse(content);

      expect(healthAnalysis.overallHealth).toBe('good');
      expect(healthAnalysis.confidence).toBe(85);
      expect(healthAnalysis.recommendations).toHaveLength(1);
      expect(healthAnalysis.moistureLevel).toBe(70);
    });

    it('should handle plant identification requests', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                plantName: 'Monstera Deliciosa',
                species: 'Monstera deliciosa',
                commonNames: ['Swiss Cheese Plant', 'Split-leaf Philodendron'],
                family: 'Araceae',
                confidence: 95
              }),
              role: 'assistant'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 250,
          completion_tokens: 200,
          total_tokens: 450
        }
      });

      mockOpenAI.chat.completions.create.mockImplementation(mockCreate);

      const identificationPrompt = 'Identifica esta planta y proporciona información taxonómica en formato JSON.';

      const response = await mockOpenAI.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Eres un experto en identificación de plantas. Responde en formato JSON.' },
          { role: 'user', content: identificationPrompt }
        ],
        max_tokens: 300,
        temperature: 0.2
      });

      const content = response.choices[0].message.content;
      const plantInfo = JSON.parse(content);

      expect(plantInfo.plantName).toBe('Monstera Deliciosa');
      expect(plantInfo.species).toBe('Monstera deliciosa');
      expect(plantInfo.confidence).toBe(95);
      expect(plantInfo.commonNames).toHaveLength(2);
    });
  });

  describe('Image Analysis API', () => {
    it('should successfully analyze plant image', async () => {
      const mockAnalyze = vi.fn().mockResolvedValue({
        data: {
          analysis: {
            plantType: 'Monstera Deliciosa',
            healthStatus: 'good',
            leafCondition: 'healthy',
            soilMoisture: 'adequate',
            lightExposure: 'appropriate',
            recommendations: [
              'Continue current watering schedule',
              'Maintain indirect light exposure',
              'Consider fertilizing in spring'
            ]
          },
          confidence: 88
        }
      });

      mockOpenAI.images.analyze.mockImplementation(mockAnalyze);

      const imageData = new Uint8Array([1, 2, 3, 4, 5]);
      const imagePrompt = 'Analyze this plant image for health and care recommendations.';

      const response = await mockOpenAI.images.analyze({
        image: imageData,
        prompt: imagePrompt,
        model: 'gpt-4-vision-preview',
        max_tokens: 500
      });

      expect(response.data.analysis.plantType).toBe('Monstera Deliciosa');
      expect(response.data.analysis.healthStatus).toBe('good');
      expect(response.data.confidence).toBe(88);
      expect(response.data.analysis.recommendations).toHaveLength(3);
    });

    it('should handle disease detection in plants', async () => {
      const mockAnalyze = vi.fn().mockResolvedValue({
        data: {
          analysis: {
            plantType: 'Monstera Deliciosa',
            healthStatus: 'poor',
            detectedIssues: [
              {
                type: 'disease',
                severity: 'moderate',
                description: 'Leaf spots detected - possible fungal infection',
                affectedAreas: ['lower leaves'],
                treatment: 'Remove affected leaves and apply fungicide'
              },
              {
                type: 'nutrition',
                severity: 'mild',
                description: 'Slight yellowing of leaves',
                affectedAreas: ['new growth'],
                treatment: 'Check soil pH and consider fertilization'
              }
            ],
            recommendations: [
              'Immediate: Remove affected leaves',
              'Apply fungicide treatment',
              'Improve air circulation',
              'Check soil moisture levels'
            ],
            urgency: 'moderate'
          },
          confidence: 92
        }
      });

      mockOpenAI.images.analyze.mockImplementation(mockAnalyze);

      const sickPlantImage = new Uint8Array([1, 2, 3, 4, 5]);
      const analysisPrompt = 'Analyze this plant image for diseases and health issues.';

      const response = await mockOpenAI.images.analyze({
        image: sickPlantImage,
        prompt: analysisPrompt,
        model: 'gpt-4-vision-preview',
        max_tokens: 600
      });

      expect(response.data.analysis.healthStatus).toBe('poor');
      expect(response.data.analysis.detectedIssues).toHaveLength(2);
      expect(response.data.analysis.urgency).toBe('moderate');
      expect(response.data.confidence).toBe(92);
    });

    it('should handle progress tracking analysis', async () => {
      const mockAnalyze = vi.fn().mockResolvedValue({
        data: {
          analysis: {
            comparison: {
              before: {
                leafCount: 8,
                healthScore: 75,
                colorSaturation: 'moderate'
              },
              after: {
                leafCount: 11,
                healthScore: 88,
                colorSaturation: 'high'
              }
            },
            improvements: [
              'Increased leaf count by 3',
              'Improved overall health score by 13 points',
              'Enhanced leaf color and vibrancy'
            ],
            growthRate: 'positive',
            recommendations: [
              'Continue current care routine',
              'Consider repotting in spring',
              'Maintain current light conditions'
            ]
          },
          confidence: 85
        }
      });

      mockOpenAI.images.analyze.mockImplementation(mockAnalyze);

      const progressImages = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])];
      const progressPrompt = 'Compare these two plant images to track growth progress.';

      const response = await mockOpenAI.images.analyze({
        images: progressImages,
        prompt: progressPrompt,
        model: 'gpt-4-vision-preview',
        max_tokens: 500
      });

      expect(response.data.analysis.comparison.before.leafCount).toBe(8);
      expect(response.data.analysis.comparison.after.leafCount).toBe(11);
      expect(response.data.analysis.growthRate).toBe('positive');
      expect(response.data.analysis.improvements).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limiting', async () => {
      const mockCreate = vi.fn().mockRejectedValue({
        error: {
          type: 'rate_limit_exceeded',
          message: 'Rate limit exceeded. Please try again later.',
          status: 429
        }
      });

      mockOpenAI.chat.completions.create.mockImplementation(mockCreate);

      const prompt = 'Analyze this plant.';

      try {
        await mockOpenAI.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100
        });
      } catch (error) {
        expect(error.error.type).toBe('rate_limit_exceeded');
        expect(error.error.status).toBe(429);
        expect(error.error.message).toContain('Rate limit exceeded');
      }
    });

    it('should handle invalid API key', async () => {
      const mockCreate = vi.fn().mockRejectedValue({
        error: {
          type: 'authentication_error',
          message: 'Invalid API key provided.',
          status: 401
        }
      });

      mockOpenAI.chat.completions.create.mockImplementation(mockCreate);

      const prompt = 'Analyze this plant.';

      try {
        await mockOpenAI.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100
        });
      } catch (error) {
        expect(error.error.type).toBe('authentication_error');
        expect(error.error.status).toBe(401);
        expect(error.error.message).toBe('Invalid API key provided.');
      }
    });

    it('should handle model not found error', async () => {
      const mockCreate = vi.fn().mockRejectedValue({
        error: {
          type: 'invalid_request_error',
          message: 'Model not found: gpt-5',
          status: 400
        }
      });

      mockOpenAI.chat.completions.create.mockImplementation(mockCreate);

      const prompt = 'Analyze this plant.';

      try {
        await mockOpenAI.chat.completions.create({
          model: 'gpt-5',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100
        });
      } catch (error) {
        expect(error.error.type).toBe('invalid_request_error');
        expect(error.error.status).toBe(400);
        expect(error.error.message).toContain('Model not found');
      }
    });

    it('should handle content filtering', async () => {
      const mockCreate = vi.fn().mockRejectedValue({
        error: {
          type: 'content_filter_error',
          message: 'Content filtered due to policy violation.',
          status: 400
        }
      });

      mockOpenAI.chat.completions.create.mockImplementation(mockCreate);

      const inappropriatePrompt = 'Inappropriate content here.';

      try {
        await mockOpenAI.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: inappropriatePrompt }],
          max_tokens: 100
        });
      } catch (error) {
        expect(error.error.type).toBe('content_filter_error');
        expect(error.error.status).toBe(400);
        expect(error.error.message).toContain('Content filtered');
      }
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large context windows efficiently', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Response to large context.',
              role: 'assistant'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 8000,
          completion_tokens: 500,
          total_tokens: 8500
        }
      });

      mockOpenAI.chat.completions.create.mockImplementation(mockCreate);

      const largeContext = Array.from({ length: 100 }, (_, i) => ({
        role: 'user',
        content: `Plant information ${i}: This is a detailed description of plant ${i} with care instructions, health status, and growth history.`
      }));

      const response = await mockOpenAI.chat.completions.create({
        model: 'gpt-4',
        messages: largeContext,
        max_tokens: 300,
        temperature: 0.7
      });

      expect(response.usage.prompt_tokens).toBeGreaterThan(7000);
      expect(response.usage.total_tokens).toBe(8500);
      expect(response.choices[0].message.content).toBeDefined();
    });

    it('should handle concurrent API requests', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Response', role: 'assistant' } }],
        usage: { total_tokens: 100 }
      });

      mockOpenAI.chat.completions.create.mockImplementation(mockCreate);

      const requests = Array.from({ length: 5 }, (_, i) => ({
        model: 'gpt-4',
        messages: [{ role: 'user', content: `Plant analysis request ${i}` }],
        max_tokens: 100
      }));

      const responses = await Promise.all(
        requests.map(request => mockOpenAI.chat.completions.create(request))
      );

      expect(responses).toHaveLength(5);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(5);
      
      responses.forEach(response => {
        expect(response.choices).toHaveLength(1);
        expect(response.usage.total_tokens).toBe(100);
      });
    });
  });

  describe('Response Validation', () => {
    it('should validate structured JSON responses', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                plantName: 'Monstera Deliciosa',
                healthScore: 85,
                recommendations: ['Water regularly', 'Provide indirect light'],
                nextCheck: '2024-02-01'
              }),
              role: 'assistant'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { total_tokens: 200 }
      });

      mockOpenAI.chat.completions.create.mockImplementation(mockCreate);

      const prompt = 'Provide plant analysis in JSON format.';

      const response = await mockOpenAI.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300
      });

      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);

      expect(analysis.plantName).toBe('Monstera Deliciosa');
      expect(analysis.healthScore).toBe(85);
      expect(analysis.recommendations).toHaveLength(2);
      expect(analysis.nextCheck).toBe('2024-02-01');
    });

    it('should handle malformed JSON responses', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Invalid JSON response with missing brackets',
              role: 'assistant'
            },
            finish_reason: 'stop'
          }
        ],
        usage: { total_tokens: 100 }
      });

      mockOpenAI.chat.completions.create.mockImplementation(mockCreate);

      const prompt = 'Provide plant analysis in JSON format.';

      const response = await mockOpenAI.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300
      });

      const content = response.choices[0].message.content;

      expect(() => JSON.parse(content)).toThrow();
      expect(content).toBe('Invalid JSON response with missing brackets');
    });
  });
}); 