import { describe, it, expect, vi, beforeEach } from 'vitest';
import { plantService } from '../../../src/services/plantService';
import { Plant, PlantImage, HealthAnalysis } from '../../../src/schemas';

// Mock de Supabase
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      }))
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({
          data: { path: 'test-image.jpg' },
          error: null
        })),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://example.com/test-image.jpg' }
        }))
      }))
    }
  }
}));

const mockPlant: Plant = {
  id: 'test-plant-1',
  name: 'Monstera Deliciosa',
  species: 'Monstera deliciosa',
  nickname: 'Monstera',
  description: 'Una hermosa planta tropical',
  funFacts: ['Es nativa de México'],
  location: 'Interior',
  plantEnvironment: 'interior',
  lightRequirements: 'luz_indirecta',
  dateAdded: new Date('2024-01-01'),
  images: [
    {
      id: 'img-1',
      url: 'https://example.com/monstera.jpg',
      timestamp: new Date('2024-01-01'),
      isProfileImage: true,
      healthAnalysis: {
        overallHealth: 'good',
        confidence: 85,
        issues: [],
        recommendations: ['Keep up the good care!'],
        moistureLevel: 70,
        growthStage: 'mature'
      }
    }
  ],
  healthScore: 85,
  careProfile: {
    wateringFrequency: 7,
    sunlightRequirement: 'medium',
    humidityPreference: 'high',
    temperatureRange: { min: 18, max: 25 },
    fertilizingFrequency: 30,
    soilType: 'Well-draining potting mix'
  },
  personality: {
    traits: ['friendly', 'resilient'],
    communicationStyle: 'cheerful',
    catchphrases: ['¡Hola!', '¡Gracias por cuidarme!'],
    moodFactors: { health: 0.8, care: 0.9, attention: 0.7 }
  },
  chatHistory: [],
  notifications: []
};

describe('plantService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserPlants', () => {
    it('should fetch plants for a user', async () => {
      const mockPlants = [mockPlant];
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                data: mockPlants,
                error: null
              })
            })
          })
        })
      });

      const result = await plantService.getUserPlants('test-user-id');

      expect(result).toEqual(mockPlants);
      expect(supabase.from).toHaveBeenCalledWith('plants');
    });

    it('should handle errors when fetching plants', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        })
      });

      await expect(plantService.getUserPlants('test-user-id')).rejects.toThrow();
    });
  });

  describe('getPlantById', () => {
    it('should fetch a specific plant by ID', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: mockPlant,
              error: null
            })
          })
        })
      });

      const result = await plantService.getPlantById('test-plant-1');

      expect(result).toEqual(mockPlant);
      expect(supabase.from).toHaveBeenCalledWith('plants');
    });

    it('should handle plant not found', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: null,
              error: null
            })
          })
        })
      });

      const result = await plantService.getPlantById('non-existent-plant');

      expect(result).toBeNull();
    });
  });

  describe('addPlantImage', () => {
    it('should add an image to a plant', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.storage.from as any).mockReturnValue({
        upload: vi.fn().mockReturnValue({
          data: { path: 'test-image.jpg' },
          error: null
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test-image.jpg' }
        })
      });

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: {
                id: 'new-image-id',
                url: 'https://example.com/test-image.jpg',
                timestamp: new Date().toISOString(),
                isProfileImage: false,
                healthAnalysis: {
                  overallHealth: 'good',
                  confidence: 90,
                  issues: [],
                  recommendations: ['Great care!'],
                  moistureLevel: 75,
                  growthStage: 'mature'
                }
              },
              error: null
            })
          })
        })
      });

      const imageData = {
        plantId: 'test-plant-1',
        imageFile: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        healthAnalysis: {
          overallHealth: 'good',
          confidence: 90,
          issues: [],
          recommendations: ['Great care!'],
          moistureLevel: 75,
          growthStage: 'mature'
        }
      };

      const result = await plantService.addPlantImage(imageData);

      expect(result).toBeDefined();
      expect(supabase.storage.from).toHaveBeenCalledWith('plant-images');
      expect(supabase.from).toHaveBeenCalledWith('plant_images');
    });

    it('should handle upload errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.storage.from as any).mockReturnValue({
        upload: vi.fn().mockReturnValue({
          data: null,
          error: { message: 'Upload failed' }
        })
      });

      const imageData = {
        plantId: 'test-plant-1',
        imageFile: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        healthAnalysis: {
          overallHealth: 'good',
          confidence: 90,
          issues: [],
          recommendations: ['Great care!'],
          moistureLevel: 75,
          growthStage: 'mature'
        }
      };

      await expect(plantService.addPlantImage(imageData)).rejects.toThrow();
    });
  });

  describe('updatePlantHealthScore', () => {
    it('should update plant health score', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: { ...mockPlant, healthScore: 90 },
                error: null
              })
            })
          })
        })
      });

      const updateData = {
        plant: mockPlant,
        userId: 'test-user'
      };

      const result = await plantService.updatePlantHealthScore(updateData);

      expect(result).toBeDefined();
      expect(supabase.from).toHaveBeenCalledWith('plants');
    });

    it('should handle update errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: null,
                error: { message: 'Update failed' }
              })
            })
          })
        })
      });

      const updateData = {
        plant: mockPlant,
        userId: 'test-user'
      };

      await expect(plantService.updatePlantHealthScore(updateData)).rejects.toThrow();
    });
  });

  describe('updatePlantInfo', () => {
    it('should update plant information', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: { ...mockPlant, description: 'Updated description' },
                error: null
              })
            })
          })
        })
      });

      const updateData = {
        plantId: 'test-plant-1',
        updates: {
          description: 'Updated description',
          plantEnvironment: 'exterior'
        }
      };

      const result = await plantService.updatePlantInfo(updateData);

      expect(result).toBeDefined();
      expect(supabase.from).toHaveBeenCalledWith('plants');
    });
  });

  describe('addChatMessage', () => {
    it('should add a chat message to a plant', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: {
                id: 'msg-1',
                plantId: 'test-plant-1',
                sender: 'user',
                content: 'Hello plant!',
                timestamp: new Date().toISOString(),
                emotion: 'happy'
              },
              error: null
            })
          })
        })
      });

      const messageData = {
        plantId: 'test-plant-1',
        sender: 'user' as const,
        content: 'Hello plant!',
        emotion: 'happy' as const
      };

      const result = await plantService.addChatMessage(messageData);

      expect(result).toBeDefined();
      expect(supabase.from).toHaveBeenCalledWith('chat_messages');
    });
  });
}); 