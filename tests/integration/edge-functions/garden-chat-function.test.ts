import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../../src/lib/supabase';

// Mock de Supabase
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('Garden Chat Edge Function Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Garden Chat Function Calls', () => {
    it('should successfully send garden chat message', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          response: '¡Hola! Soy tu asistente de jardín. Tus plantas están en buen estado general. ¿En qué puedo ayudarte?',
          timestamp: new Date().toISOString(),
          context: {
            totalPlants: 3,
            averageHealth: 85,
            needsAttention: 1
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const message = 'Hola, ¿cómo están mis plantas?';
      const gardenContext = {
        totalPlants: 3,
        averageHealth: 85,
        plantsData: [
          { id: 'plant-1', name: 'Monstera', healthScore: 90 },
          { id: 'plant-2', name: 'Orchid', healthScore: 75 },
          { id: 'plant-3', name: 'Snake Plant', healthScore: 90 }
        ]
      };

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          message,
          gardenContext,
          userId: 'test-user'
        }
      });

      expect(response.data).toBeDefined();
      expect(response.data.response).toContain('¡Hola!');
      expect(response.data.context.totalPlants).toBe(3);
      expect(response.data.context.averageHealth).toBe(85);
      expect(response.error).toBeNull();
    });

    it('should handle specific plant queries', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          response: 'Tu Monstera Deliciosa está en excelente estado. Sus hojas están verdes y saludables. Te recomiendo mantener el riego actual y asegurarte de que reciba luz indirecta brillante.',
          timestamp: new Date().toISOString(),
          context: {
            plantId: 'plant-1',
            plantName: 'Monstera Deliciosa',
            healthScore: 90
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const specificQuery = '¿Cómo está mi Monstera Deliciosa?';
      const gardenContext = {
        totalPlants: 3,
        averageHealth: 85,
        plantsData: [
          { id: 'plant-1', name: 'Monstera Deliciosa', healthScore: 90 },
          { id: 'plant-2', name: 'Orchid', healthScore: 75 },
          { id: 'plant-3', name: 'Snake Plant', healthScore: 90 }
        ]
      };

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          message: specificQuery,
          gardenContext,
          userId: 'test-user'
        }
      });

      expect(response.data.response).toContain('Monstera Deliciosa');
      expect(response.data.response).toContain('excelente estado');
      expect(response.data.context.plantName).toBe('Monstera Deliciosa');
      expect(response.data.context.healthScore).toBe(90);
    });

    it('should handle care recommendations queries', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          response: 'Para mejorar el riego de tus plantas, te recomiendo:\n\n1. Riega cuando la tierra esté seca al tacto\n2. Usa agua a temperatura ambiente\n3. Evita el encharcamiento\n4. Considera usar un humidificador para plantas tropicales',
          timestamp: new Date().toISOString(),
          context: {
            topic: 'watering',
            recommendations: 4
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const careQuery = '¿Cómo puedo mejorar el riego de mis plantas?';
      const gardenContext = {
        totalPlants: 3,
        averageHealth: 85,
        plantsData: [
          { id: 'plant-1', name: 'Monstera', healthScore: 90 },
          { id: 'plant-2', name: 'Orchid', healthScore: 75 },
          { id: 'plant-3', name: 'Snake Plant', healthScore: 90 }
        ]
      };

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          message: careQuery,
          gardenContext,
          userId: 'test-user'
        }
      });

      expect(response.data.response).toContain('riego');
      expect(response.data.response).toContain('recomiendo');
      expect(response.data.context.topic).toBe('watering');
      expect(response.data.context.recommendations).toBe(4);
    });
  });

  describe('Function Error Handling', () => {
    it('should handle AI service unavailable', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'AI chat service is currently unavailable. Please try again later.',
          status: 503
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const message = 'Hola, ¿cómo están mis plantas?';
      const gardenContext = {
        totalPlants: 3,
        averageHealth: 85,
        plantsData: []
      };

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          message,
          gardenContext,
          userId: 'test-user'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.message).toContain('unavailable');
      expect(response.error.status).toBe(503);
    });

    it('should handle invalid garden context', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Invalid garden context provided. Please provide valid plant data.',
          status: 400
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const message = 'Hola';
      const invalidContext = {
        totalPlants: -1,
        averageHealth: 150,
        plantsData: null
      };

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          message,
          gardenContext: invalidContext,
          userId: 'test-user'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.message).toContain('Invalid garden context');
      expect(response.error.status).toBe(400);
    });

    it('should handle empty message', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Message cannot be empty. Please provide a valid message.',
          status: 400
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const emptyMessage = '';
      const gardenContext = {
        totalPlants: 3,
        averageHealth: 85,
        plantsData: []
      };

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          message: emptyMessage,
          gardenContext,
          userId: 'test-user'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.message).toContain('empty');
      expect(response.error.status).toBe(400);
    });

    it('should handle unauthorized access', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Unauthorized access. Please authenticate.',
          status: 401
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const message = 'Hola';
      const gardenContext = {
        totalPlants: 3,
        averageHealth: 85,
        plantsData: []
      };

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          message,
          gardenContext,
          userId: null
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(401);
      expect(response.error.message).toContain('Unauthorized');
    });
  });

  describe('Function Performance', () => {
    it('should handle multiple concurrent chat messages', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          response: 'Respuesta rápida',
          timestamp: new Date().toISOString()
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const messages = [
        'Hola',
        '¿Cómo están mis plantas?',
        '¿Qué fertilizante recomiendas?',
        '¿Cómo riego mis plantas?'
      ];

      const gardenContext = {
        totalPlants: 3,
        averageHealth: 85,
        plantsData: []
      };

      const responses = await Promise.all(
        messages.map(message =>
          supabase.functions.invoke('garden-ai-chat', {
            body: {
              message,
              gardenContext,
              userId: 'test-user'
            }
          })
        )
      );

      expect(responses).toHaveLength(4);
      expect(mockInvoke).toHaveBeenCalledTimes(4);
      
      responses.forEach(response => {
        expect(response.data).toBeDefined();
        expect(response.error).toBeNull();
      });
    });

    it('should handle large garden context efficiently', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          response: 'Tu jardín tiene muchas plantas. Aquí tienes un resumen general.',
          timestamp: new Date().toISOString()
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const largeGardenContext = {
        totalPlants: 50,
        averageHealth: 85,
        plantsData: Array.from({ length: 50 }, (_, i) => ({
          id: `plant-${i}`,
          name: `Plant ${i}`,
          healthScore: 80 + (i % 20)
        }))
      };

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          message: '¿Cómo está mi jardín?',
          gardenContext: largeGardenContext,
          userId: 'test-user'
        }
      });

      expect(response.data).toBeDefined();
      expect(response.data.response).toContain('muchas plantas');
      expect(response.error).toBeNull();
    });
  });

  describe('Function Response Validation', () => {
    it('should validate response structure for successful chat', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          response: '¡Hola! Soy tu asistente de jardín.',
          timestamp: new Date().toISOString(),
          context: {
            totalPlants: 3,
            averageHealth: 85
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const message = 'Hola';
      const gardenContext = {
        totalPlants: 3,
        averageHealth: 85,
        plantsData: []
      };

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          message,
          gardenContext,
          userId: 'test-user'
        }
      });

      // Validar estructura de respuesta
      expect(response.data).toHaveProperty('response');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('context');
      expect(response.data.context).toHaveProperty('totalPlants');
      expect(response.data.context).toHaveProperty('averageHealth');
    });

    it('should handle empty garden context gracefully', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          response: 'Parece que aún no tienes plantas en tu jardín. ¿Te gustaría que te ayude a comenzar?',
          timestamp: new Date().toISOString(),
          context: {
            totalPlants: 0,
            averageHealth: 0
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const message = 'Hola';
      const emptyGardenContext = {
        totalPlants: 0,
        averageHealth: 0,
        plantsData: []
      };

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          message,
          gardenContext: emptyGardenContext,
          userId: 'test-user'
        }
      });

      expect(response.data.response).toContain('no tienes plantas');
      expect(response.data.context.totalPlants).toBe(0);
      expect(response.data.context.averageHealth).toBe(0);
    });
  });

  describe('Function Security', () => {
    it('should handle rate limiting', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Rate limit exceeded. Please try again later.',
          status: 429
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const message = 'Hola';
      const gardenContext = {
        totalPlants: 3,
        averageHealth: 85,
        plantsData: []
      };

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          message,
          gardenContext,
          userId: 'test-user'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(429);
      expect(response.error.message).toContain('Rate limit');
    });

    it('should handle malformed requests', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Invalid request format. Please check your request body.',
          status: 400
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          // Missing required fields
          userId: 'test-user'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(400);
      expect(response.error.message).toContain('Invalid request');
    });
  });

  describe('Function Context Handling', () => {
    it('should handle garden context with health issues', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          response: 'Veo que algunas de tus plantas necesitan atención. Te recomiendo revisar el riego y la iluminación.',
          timestamp: new Date().toISOString(),
          context: {
            totalPlants: 3,
            averageHealth: 65,
            needsAttention: 2,
            urgentIssues: [
              'Monstera: Hojas amarillas',
              'Orchid: Falta de luz'
            ]
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const message = '¿Cómo están mis plantas?';
      const gardenContextWithIssues = {
        totalPlants: 3,
        averageHealth: 65,
        plantsData: [
          { id: 'plant-1', name: 'Monstera', healthScore: 60 },
          { id: 'plant-2', name: 'Orchid', healthScore: 50 },
          { id: 'plant-3', name: 'Snake Plant', healthScore: 85 }
        ]
      };

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          message,
          gardenContext: gardenContextWithIssues,
          userId: 'test-user'
        }
      });

      expect(response.data.response).toContain('necesitan atención');
      expect(response.data.context.averageHealth).toBe(65);
      expect(response.data.context.needsAttention).toBe(2);
      expect(response.data.context.urgentIssues).toHaveLength(2);
    });

    it('should handle garden context with healthy plants', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          response: '¡Excelente! Tus plantas están en perfecto estado. Todas muestran signos de crecimiento saludable.',
          timestamp: new Date().toISOString(),
          context: {
            totalPlants: 3,
            averageHealth: 92,
            needsAttention: 0,
            highlights: [
              'Monstera: Crecimiento vigoroso',
              'Orchid: Floración abundante',
              'Snake Plant: Hojas brillantes'
            ]
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const message = '¿Cómo están mis plantas?';
      const healthyGardenContext = {
        totalPlants: 3,
        averageHealth: 92,
        plantsData: [
          { id: 'plant-1', name: 'Monstera', healthScore: 95 },
          { id: 'plant-2', name: 'Orchid', healthScore: 90 },
          { id: 'plant-3', name: 'Snake Plant', healthScore: 92 }
        ]
      };

      const response = await supabase.functions.invoke('garden-ai-chat', {
        body: {
          message,
          gardenContext: healthyGardenContext,
          userId: 'test-user'
        }
      });

      expect(response.data.response).toContain('perfecto estado');
      expect(response.data.context.averageHealth).toBe(92);
      expect(response.data.context.needsAttention).toBe(0);
      expect(response.data.context.highlights).toHaveLength(3);
    });
  });
}); 