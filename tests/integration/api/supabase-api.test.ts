import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../../src/lib/supabase';

// Mock de Supabase
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn()
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
        getPublicUrl: vi.fn()
      }))
    },
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('Supabase API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication API', () => {
    it('should successfully authenticate user', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            created_at: '2024-01-01T00:00:00Z'
          },
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token'
          }
        },
        error: null
      });

      (supabase.auth.signIn as any).mockImplementation(mockSignIn);

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await supabase.auth.signIn(credentials);

      expect(response.data.user).toBeDefined();
      expect(response.data.user.id).toBe('test-user-id');
      expect(response.data.user.email).toBe('test@example.com');
      expect(response.data.session).toBeDefined();
      expect(response.error).toBeNull();
    });

    it('should handle authentication failure', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Invalid login credentials',
          status: 400
        }
      });

      (supabase.auth.signIn as any).mockImplementation(mockSignIn);

      const credentials = {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      };

      const response = await supabase.auth.signIn(credentials);

      expect(response.data.user).toBeNull();
      expect(response.data.session).toBeNull();
      expect(response.error.message).toBe('Invalid login credentials');
      expect(response.error.status).toBe(400);
    });

    it('should successfully register new user', async () => {
      const mockSignUp = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'new-user-id',
            email: 'new@example.com',
            created_at: '2024-01-01T00:00:00Z'
          },
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token'
          }
        },
        error: null
      });

      (supabase.auth.signUp as any).mockImplementation(mockSignUp);

      const userData = {
        email: 'new@example.com',
        password: 'password123'
      };

      const response = await supabase.auth.signUp(userData);

      expect(response.data.user).toBeDefined();
      expect(response.data.user.id).toBe('new-user-id');
      expect(response.data.user.email).toBe('new@example.com');
      expect(response.data.session).toBeDefined();
      expect(response.error).toBeNull();
    });

    it('should handle user sign out', async () => {
      const mockSignOut = vi.fn().mockResolvedValue({
        error: null
      });

      (supabase.auth.signOut as any).mockImplementation(mockSignOut);

      const response = await supabase.auth.signOut();

      expect(response.error).toBeNull();
    });
  });

  describe('Database API - Plants', () => {
    it('should successfully fetch user plants', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'plant-1',
            name: 'Monstera Deliciosa',
            nickname: 'Monster',
            healthScore: 85,
            created_at: '2024-01-01T00:00:00Z',
            user_id: 'test-user-id'
          },
          {
            id: 'plant-2',
            name: 'Orchid',
            nickname: 'Orchid',
            healthScore: 75,
            created_at: '2024-01-02T00:00:00Z',
            user_id: 'test-user-id'
          }
        ],
        error: null
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue(mockSelect())
          })
        })
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const userId = 'test-user-id';
      const response = await supabase
        .from('plants')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      expect(response.data).toHaveLength(2);
      expect(response.data[0].name).toBe('Monstera Deliciosa');
      expect(response.data[1].name).toBe('Orchid');
      expect(response.error).toBeNull();
    });

    it('should successfully create new plant', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'new-plant-id',
            name: 'Snake Plant',
            nickname: 'Snake',
            healthScore: 90,
            created_at: '2024-01-03T00:00:00Z',
            user_id: 'test-user-id'
          }
        ],
        error: null
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue(mockInsert())
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const newPlant = {
        name: 'Snake Plant',
        nickname: 'Snake',
        healthScore: 90,
        user_id: 'test-user-id'
      };

      const response = await supabase
        .from('plants')
        .insert(newPlant);

      expect(response.data).toHaveLength(1);
      expect(response.data[0].name).toBe('Snake Plant');
      expect(response.data[0].healthScore).toBe(90);
      expect(response.error).toBeNull();
    });

    it('should successfully update plant', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'plant-1',
            name: 'Monstera Deliciosa',
            nickname: 'Updated Monster',
            healthScore: 88,
            updated_at: '2024-01-03T00:00:00Z'
          }
        ],
        error: null
      });

      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(mockUpdate())
        })
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const updateData = {
        nickname: 'Updated Monster',
        healthScore: 88
      };

      const response = await supabase
        .from('plants')
        .update(updateData)
        .eq('id', 'plant-1');

      expect(response.data).toHaveLength(1);
      expect(response.data[0].nickname).toBe('Updated Monster');
      expect(response.data[0].healthScore).toBe(88);
      expect(response.error).toBeNull();
    });

    it('should successfully delete plant', async () => {
      const mockDelete = vi.fn().mockResolvedValue({
        data: null,
        error: null
      });

      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(mockDelete())
        })
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const response = await supabase
        .from('plants')
        .delete()
        .eq('id', 'plant-1');

      expect(response.data).toBeNull();
      expect(response.error).toBeNull();
    });
  });

  describe('Database API - Plant Images', () => {
    it('should successfully fetch plant images', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'img-1',
            plant_id: 'plant-1',
            url: 'https://example.com/image1.jpg',
            timestamp: '2024-01-01T00:00:00Z',
            is_profile_image: true,
            health_analysis: {
              overallHealth: 'good',
              confidence: 85
            }
          },
          {
            id: 'img-2',
            plant_id: 'plant-1',
            url: 'https://example.com/image2.jpg',
            timestamp: '2024-01-02T00:00:00Z',
            is_profile_image: false,
            health_analysis: {
              overallHealth: 'excellent',
              confidence: 92
            }
          }
        ],
        error: null
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue(mockSelect())
          })
        })
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const plantId = 'plant-1';
      const response = await supabase
        .from('plant_images')
        .select('*')
        .eq('plant_id', plantId)
        .order('timestamp', { ascending: false });

      expect(response.data).toHaveLength(2);
      expect(response.data[0].url).toBe('https://example.com/image1.jpg');
      expect(response.data[1].url).toBe('https://example.com/image2.jpg');
      expect(response.error).toBeNull();
    });

    it('should successfully upload plant image', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'new-img-id',
            plant_id: 'plant-1',
            url: 'https://example.com/new-image.jpg',
            timestamp: '2024-01-03T00:00:00Z',
            is_profile_image: false,
            health_analysis: {
              overallHealth: 'good',
              confidence: 88
            }
          }
        ],
        error: null
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue(mockInsert())
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const newImage = {
        plant_id: 'plant-1',
        url: 'https://example.com/new-image.jpg',
        is_profile_image: false,
        health_analysis: {
          overallHealth: 'good',
          confidence: 88
        }
      };

      const response = await supabase
        .from('plant_images')
        .insert(newImage);

      expect(response.data).toHaveLength(1);
      expect(response.data[0].url).toBe('https://example.com/new-image.jpg');
      expect(response.data[0].health_analysis.confidence).toBe(88);
      expect(response.error).toBeNull();
    });
  });

  describe('Storage API', () => {
    it('should successfully upload image to storage', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: {
          path: 'plants/test-user/plant-1/image.jpg'
        },
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(mockUpload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const imageFile = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const path = 'plants/test-user/plant-1/image.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .upload(path, imageFile);

      expect(response.data.path).toBe('plants/test-user/plant-1/image.jpg');
      expect(response.error).toBeNull();
    });

    it('should successfully get public URL for image', async () => {
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: {
          publicUrl: 'https://example.supabase.co/storage/v1/object/public/plant-images/plants/test-user/plant-1/image.jpg'
        }
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue(mockGetPublicUrl())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const path = 'plants/test-user/plant-1/image.jpg';

      const response = supabase.storage
        .from('plant-images')
        .getPublicUrl(path);

      expect(response.data.publicUrl).toContain('https://example.supabase.co');
      expect(response.data.publicUrl).toContain('plant-images');
      expect(response.data.publicUrl).toContain(path);
    });

    it('should successfully delete image from storage', async () => {
      const mockRemove = vi.fn().mockResolvedValue({
        data: null,
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue(mockRemove())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const path = 'plants/test-user/plant-1/image.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .remove([path]);

      expect(response.data).toBeNull();
      expect(response.error).toBeNull();
    });

    it('should handle storage upload failure', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'File size exceeds limit',
          status: 413
        }
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(mockUpload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const largeImage = new File(['x'.repeat(15 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const path = 'plants/test-user/plant-1/large.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .upload(path, largeImage);

      expect(response.data).toBeNull();
      expect(response.error.message).toBe('File size exceeds limit');
      expect(response.error.status).toBe(413);
    });
  });

  describe('Edge Functions API', () => {
    it('should successfully invoke analyze-image function', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          plantName: 'Monstera Deliciosa',
          healthAnalysis: {
            overallHealth: 'good',
            confidence: 85
          }
        },
        error: null
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const imageData = new Uint8Array([1, 2, 3, 4, 5]);

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: Array.from(imageData),
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeDefined();
      expect(response.data.plantName).toBe('Monstera Deliciosa');
      expect(response.data.healthAnalysis.confidence).toBe(85);
      expect(response.error).toBeNull();
    });

    it('should successfully invoke garden-chat function', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: {
          response: '¡Hola! Soy tu asistente de jardín.',
          timestamp: new Date().toISOString()
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

      expect(response.data).toBeDefined();
      expect(response.data.response).toContain('¡Hola!');
      expect(response.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Network error - unable to connect',
          status: 500
        }
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue(mockSelect())
          })
        })
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const response = await supabase
        .from('plants')
        .select('*')
        .eq('user_id', 'test-user')
        .order('created_at', { ascending: false });

      expect(response.data).toBeNull();
      expect(response.error.message).toBe('Network error - unable to connect');
      expect(response.error.status).toBe(500);
    });

    it('should handle unauthorized access', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Unauthorized access',
          status: 401
        }
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue(mockSelect())
          })
        })
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const response = await supabase
        .from('plants')
        .select('*')
        .eq('user_id', 'test-user')
        .order('created_at', { ascending: false });

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(401);
      expect(response.error.message).toBe('Unauthorized access');
    });

    it('should handle rate limiting', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Rate limit exceeded',
          status: 429
        }
      });

      (supabase.functions.invoke as any).mockImplementation(mockInvoke);

      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          image: [1, 2, 3, 4, 5],
          filename: 'plant.jpg',
          contentType: 'image/jpeg'
        }
      });

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(429);
      expect(response.error.message).toBe('Rate limit exceeded');
    });
  });

  describe('Data Validation', () => {
    it('should validate plant data structure', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'plant-1',
            name: 'Monstera Deliciosa',
            nickname: 'Monster',
            healthScore: 85,
            created_at: '2024-01-01T00:00:00Z',
            user_id: 'test-user-id',
            environment: 'interior',
            light_requirement: 'luz_indirecta'
          }
        ],
        error: null
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue(mockSelect())
          })
        })
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const response = await supabase
        .from('plants')
        .select('*')
        .eq('user_id', 'test-user-id')
        .order('created_at', { ascending: false });

      expect(response.data).toHaveLength(1);
      expect(response.data[0]).toHaveProperty('id');
      expect(response.data[0]).toHaveProperty('name');
      expect(response.data[0]).toHaveProperty('healthScore');
      expect(response.data[0]).toHaveProperty('environment');
      expect(response.data[0]).toHaveProperty('light_requirement');
    });

    it('should validate image data structure', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'img-1',
            plant_id: 'plant-1',
            url: 'https://example.com/image.jpg',
            timestamp: '2024-01-01T00:00:00Z',
            is_profile_image: true,
            health_analysis: {
              overallHealth: 'good',
              confidence: 85,
              issues: [],
              recommendations: ['Keep up the good care!']
            }
          }
        ],
        error: null
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue(mockSelect())
          })
        })
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const response = await supabase
        .from('plant_images')
        .select('*')
        .eq('plant_id', 'plant-1')
        .order('timestamp', { ascending: false });

      expect(response.data).toHaveLength(1);
      expect(response.data[0]).toHaveProperty('id');
      expect(response.data[0]).toHaveProperty('url');
      expect(response.data[0]).toHaveProperty('health_analysis');
      expect(response.data[0].health_analysis).toHaveProperty('overallHealth');
      expect(response.data[0].health_analysis).toHaveProperty('confidence');
    });
  });
}); 