import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlantService } from '../../../src/services/plantService';
import { supabaseMock } from '../../mocks/services';
import { Plant } from '../../../src/schemas';

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
  images: [],
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

describe('PlantService', () => {
  let service: PlantService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PlantService(supabaseMock);
  });

  describe('getUserPlants', () => {
    it('should fetch plants for a user', async () => {
      // Mocks encadenados para select -> eq -> order
      const orderMock = vi.fn(() => ({ data: [
        {
          id: 'test-plant-1',
          name: 'Monstera Deliciosa',
          species: 'Monstera deliciosa',
          nickname: 'Monstera',
          description: 'Una hermosa planta tropical',
          fun_facts: ['Es nativa de México'],
          location: 'Interior',
          plant_environment: 'interior',
          light_requirements: 'luz_indirecta',
          date_added: '2024-01-01T00:00:00.000Z',
          last_watered: null,
          last_fertilized: null,
          health_score: 85,
          care_profile: mockPlant.careProfile,
          personality: mockPlant.personality,
          plant_images: [],
          chat_messages: [],
          plant_notifications: []
        }
      ], error: null }));
      const eqMock = vi.fn(() => ({ order: orderMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));
      supabaseMock.from.mockReturnValue({ select: selectMock });
      const result = await service.getUserPlants('user-123');
      expect(result[0]).toEqual(expect.objectContaining({
        id: mockPlant.id,
        name: mockPlant.name,
        species: mockPlant.species,
        nickname: mockPlant.nickname,
        description: mockPlant.description,
        healthScore: mockPlant.healthScore,
        location: mockPlant.location
      }));
    });
  });

  describe('getPlantById', () => {
    it('should fetch a specific plant by ID', async () => {
      const singleMock = vi.fn(() => ({ data: {
        id: 'test-plant-1',
        name: 'Monstera Deliciosa',
        species: 'Monstera deliciosa',
        nickname: 'Monstera',
        description: 'Una hermosa planta tropical',
        fun_facts: ['Es nativa de México'],
        location: 'Interior',
        plant_environment: 'interior',
        light_requirements: 'luz_indirecta',
        date_added: '2024-01-01T00:00:00.000Z',
        last_watered: null,
        last_fertilized: null,
        health_score: 85,
        care_profile: mockPlant.careProfile,
        personality: mockPlant.personality,
        plant_images: [],
        chat_messages: [],
        plant_notifications: []
      }, error: null }));
      const eqMock2 = vi.fn(() => ({ single: singleMock }));
      const eqMock1 = vi.fn(() => ({ eq: eqMock2 }));
      const selectMock = vi.fn(() => ({ eq: eqMock1 }));
      supabaseMock.from.mockReturnValue({ select: selectMock });
      const result = await service.getPlantById('test-plant-1', 'user-123');
      expect(result).toEqual(expect.objectContaining({
        id: mockPlant.id,
        name: mockPlant.name,
        species: mockPlant.species,
        nickname: mockPlant.nickname,
        description: mockPlant.description,
        healthScore: mockPlant.healthScore,
        location: mockPlant.location
      }));
    });
    it('should handle plant not found', async () => {
      const singleMock = vi.fn(() => ({ data: null, error: null }));
      const eqMock2 = vi.fn(() => ({ single: singleMock }));
      const eqMock1 = vi.fn(() => ({ eq: eqMock2 }));
      const selectMock = vi.fn(() => ({ eq: eqMock1 }));
      supabaseMock.from.mockReturnValue({ select: selectMock });
      const result = await service.getPlantById('non-existent-plant', 'user-123');
      expect(result).toBeNull();
    });
  });

  describe('addPlantImage', () => {
    it('should add an image to a plant', async () => {
      supabaseMock.storage.from().upload.mockReturnValue({ data: { path: 'test-image.jpg' }, error: null });
      supabaseMock.storage.from().getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } });
      const singleMock = vi.fn(() => ({ data: { id: 'img-1', url: 'https://example.com/test.jpg', created_at: new Date().toISOString(), is_profile_image: false, health_analysis: {} }, error: null }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const insertMock = vi.fn(() => ({ select: selectMock }));
      supabaseMock.from.mockReturnValue({ insert: insertMock });
      const imageData = {
        plantId: 'test-plant-1',
        imageFile: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        healthAnalysis: {}
      };
      const result = await service.addPlantImage('test-plant-1', imageData, 'user-123');
      expect(result.url).toBe('https://example.com/test.jpg');
    });
    it('should handle upload errors', async () => {
      supabaseMock.storage.from().upload.mockReturnValue({ data: null, error: { message: 'Upload failed' } });
      const singleMock = vi.fn(() => ({ data: null, error: null }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const insertMock = vi.fn(() => ({ select: selectMock }));
      supabaseMock.from.mockReturnValue({ insert: insertMock });
      const imageData = {
        plantId: 'test-plant-1',
        imageFile: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
        healthAnalysis: {}
      };
      await expect(service.addPlantImage('test-plant-1', imageData, 'user-123')).rejects.toThrow();
    });
  });

  describe('updatePlantHealthScore', () => {
    it('should update plant health score', async () => {
      // Mocks para .update().eq().eq()
      const eqMock2 = vi.fn(() => ({}));
      const eqMock1 = vi.fn(() => ({ eq: eqMock2 }));
      const updateMock = vi.fn(() => ({ eq: eqMock1 }));
      supabaseMock.from.mockReturnValue({ update: updateMock });
      await expect(service.updatePlantHealthScore('test-plant-1', 'user-123', 90)).resolves.toBeUndefined();
    });
    it('should handle update errors', async () => {
      const eqMock2 = vi.fn(() => ({ error: { message: 'Update failed' } }));
      const eqMock1 = vi.fn(() => ({ eq: eqMock2 }));
      const updateMock = vi.fn(() => ({ eq: eqMock1 }));
      supabaseMock.from.mockReturnValue({ update: updateMock });
      await expect(service.updatePlantHealthScore('test-plant-1', 'user-123', 90)).rejects.toThrow();
    });
  });

  describe('updatePlantInfo', () => {
    it('should update plant information', async () => {
      // Mocks para .update().eq().eq().select().single()
      const singleMock = vi.fn(() => ({ data: { ...mockPlant, description: 'Updated description' }, error: null }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const eqMock2 = vi.fn(() => ({ select: selectMock }));
      const eqMock1 = vi.fn(() => ({ eq: eqMock2 }));
      const updateMock = vi.fn(() => ({ eq: eqMock1 }));
      supabaseMock.from.mockReturnValue({ update: updateMock });
      const result = await service.updatePlantInfo('test-plant-1', 'user-123', { description: 'Updated description' });
      expect(result.description).toBe('Updated description');
    });
    it('should handle not found', async () => {
      const singleMock = vi.fn(() => ({ data: null, error: null }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const eqMock2 = vi.fn(() => ({ select: selectMock }));
      const eqMock1 = vi.fn(() => ({ eq: eqMock2 }));
      const updateMock = vi.fn(() => ({ eq: eqMock1 }));
      supabaseMock.from.mockReturnValue({ update: updateMock });
      await expect(service.updatePlantInfo('test-plant-1', 'user-123', { description: 'Updated description' })).rejects.toThrow('Plant not found or not updated.');
    });
  });

  describe('addChatMessage', () => {
    it('should add a chat message to a plant', async () => {
      const singleMock = vi.fn(() => ({ data: { id: 'msg-1', sender: 'user', content: 'Hello plant!', created_at: new Date().toISOString(), emotion: 'happy' }, error: null }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const insertMock = vi.fn(() => ({ select: selectMock }));
      supabaseMock.from.mockReturnValue({ insert: insertMock });
      const messageData = { sender: 'user', content: 'Hello plant!', emotion: 'happy', timestamp: new Date() };
      const result = await service.addChatMessage('test-plant-1', messageData, 'user-123');
      expect(result.id).toBe('msg-1');
      expect(result.content).toBe('Hello plant!');
    });
  });
}); 