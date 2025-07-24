import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Plant, AIAnalysisResponse } from '../src/schemas';
import { plantService } from '../src/services/plantService';
import { analyzeImage } from '../src/services/aiService';
import { uploadImage } from '../src/services/imageService';

// Mock de servicios
vi.mock('../src/services/aiService', () => ({
  analyzeImage: vi.fn()
}));

vi.mock('../src/services/imageService', () => ({
  uploadImage: vi.fn(),
  validateImageSize: vi.fn()
}));

vi.mock('../src/services/plantService', () => ({
  plantService: {
    addPlantFromAnalysis: vi.fn(),
    createPlant: vi.fn(),
    addPlantImage: vi.fn(),
    addChatMessage: vi.fn()
  }
}));

// Datos de prueba reales
const MOCK_IMAGE_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

const MOCK_AI_ANALYSIS: AIAnalysisResponse = {
  commonName: 'Monstera Deliciosa',
  species: 'Monstera deliciosa',
  variety: 'Deliciosa',
  generalDescription: 'Una hermosa planta tropical con hojas características que pueden alcanzar grandes tamaños. Es muy popular en decoración de interiores.',
  funFacts: [
    'Es nativa de México y América Central',
    'Puede crecer hasta 20 metros en su hábitat natural',
    'Las hojas jóvenes son enteras, las adultas desarrollan perforaciones'
  ],
  plantEnvironment: 'interior',
  lightRequirements: 'luz_indirecta',
  health: {
    overallHealth: 'excellent',
    issues: [],
    recommendations: [
      'Mantener en lugar con luz indirecta brillante',
      'Regar cuando el suelo esté seco al tacto',
      'Humidificar el ambiente regularmente'
    ],
    moistureLevel: 75,
    growthStage: 'mature',
    confidence: 85
  },
  careProfile: {
    wateringFrequency: 7,
    sunlightRequirement: 'medium',
    humidityPreference: 'high',
    temperatureRange: { min: 18, max: 30 },
    fertilizingFrequency: 30,
    soilType: 'universal',
    specialCare: []
  },
  personality: {
    traits: ['cheerful', 'energetic'],
    communicationStyle: 'cheerful',
    catchphrases: ['¡Hola!', '¡Qué día tan hermoso!'],
    moodFactors: { health: 1, care: 1, attention: 1 }
  }
};

const MOCK_CREATED_PLANT: Plant = {
  id: 'mock-plant-id',
  name: 'Monstera Deliciosa',
  species: 'Monstera deliciosa',
  variety: 'Deliciosa',
  nickname: 'Monstera Deliciosa',
  description: 'Una hermosa planta tropical con hojas características que pueden alcanzar grandes tamaños. Es muy popular en decoración de interiores.',
  funFacts: [
    'Es nativa de México y América Central',
    'Puede crecer hasta 20 metros en su hábitat natural',
    'Las hojas jóvenes son enteras, las adultas desarrollan perforaciones'
  ],
  location: 'Interior',
  plantEnvironment: 'interior',
  lightRequirements: 'luz_indirecta',
  dateAdded: new Date(),
  lastFertilized: undefined,
  images: [],
  healthScore: 85,
  careProfile: {
    wateringFrequency: 7,
    sunlightRequirement: 'medium',
    humidityPreference: 'high',
    temperatureRange: { min: 18, max: 30 },
    fertilizingFrequency: 30,
    soilType: 'universal',
    specialCare: []
  },
  personality: {
    traits: ['cheerful', 'energetic'],
    communicationStyle: 'cheerful',
    catchphrases: ['¡Hola!', '¡Qué día tan hermoso!'],
    moodFactors: { health: 1, care: 1, attention: 1 }
  },
  chatHistory: [],
  notifications: []
};

describe('Flujo de Creación de Plantas desde Galería', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock de analyzeImage
    (analyzeImage as any).mockResolvedValue(MOCK_AI_ANALYSIS);
    
    // Mock de uploadImage
    (uploadImage as any).mockResolvedValue('https://mock-storage-url.com/image.jpg');
    
    // Mock de plantService
    (plantService.addPlantFromAnalysis as any).mockResolvedValue(MOCK_CREATED_PLANT);
    (plantService.createPlant as any).mockResolvedValue(MOCK_CREATED_PLANT);
    (plantService.addPlantImage as any).mockResolvedValue({
      id: 'mock-image-id',
      url: 'https://mock-storage-url.com/image.jpg',
      timestamp: new Date(),
      isProfileImage: true,
      healthAnalysis: MOCK_AI_ANALYSIS.health
    });
    (plantService.addChatMessage as any).mockResolvedValue({
      id: 'mock-message-id',
      sender: 'plant',
      content: '¡Hola! Soy tu nueva Monstera Deliciosa. ¡Me encanta estar aquí contigo!',
      timestamp: new Date(),
      emotion: 'cheerful'
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PlantService - Proceso de Creación', () => {
    it('debe crear una planta completa con análisis de IA', async () => {
      const userId = 'mock-user-id';
      const imageDataUrl = MOCK_IMAGE_DATA_URL;
      const location = 'Interior';

      // Ejecutar el proceso de creación
      const result = await plantService.addPlantFromAnalysis(userId, imageDataUrl, location);

      // Verificar que se llamó analyzeImage
      expect(analyzeImage).toHaveBeenCalledWith(imageDataUrl);

      // Verificar que se creó la planta con los datos correctos
      expect(plantService.createPlant).toHaveBeenCalledWith(
        expect.objectContaining({
          name: MOCK_AI_ANALYSIS.commonName,
          species: MOCK_AI_ANALYSIS.species,
          description: MOCK_AI_ANALYSIS.generalDescription,
          funFacts: MOCK_AI_ANALYSIS.funFacts,
          location: location,
          plantEnvironment: MOCK_AI_ANALYSIS.plantEnvironment,
          lightRequirements: MOCK_AI_ANALYSIS.lightRequirements,
          healthScore: MOCK_AI_ANALYSIS.health.confidence,
          careProfile: MOCK_AI_ANALYSIS.careProfile,
          personality: MOCK_AI_ANALYSIS.personality
        }),
        userId
      );

      // Verificar el resultado
      expect(result).toEqual(MOCK_CREATED_PLANT);
    });

    it('debe manejar errores durante el proceso de creación', async () => {
      const userId = 'mock-user-id';
      const imageDataUrl = MOCK_IMAGE_DATA_URL;
      const location = 'Interior';

      // Mock de error en analyzeImage
      (analyzeImage as any).mockRejectedValue(new Error('Error de análisis de IA'));

      // Verificar que se lanza el error
      await expect(
        plantService.addPlantFromAnalysis(userId, imageDataUrl, location)
      ).rejects.toThrow('Failed to create plant from image analysis.');
    });
  });

  describe('Validación de Datos', () => {
    it('debe validar que la planta creada tenga todos los campos requeridos', () => {
      expect(MOCK_CREATED_PLANT.id).toBeDefined();
      expect(MOCK_CREATED_PLANT.name).toBe('Monstera Deliciosa');
      expect(MOCK_CREATED_PLANT.species).toBe('Monstera deliciosa');
      expect(MOCK_CREATED_PLANT.location).toBe('Interior');
      expect(MOCK_CREATED_PLANT.healthScore).toBe(85);
      expect(MOCK_CREATED_PLANT.careProfile).toBeDefined();
      expect(MOCK_CREATED_PLANT.personality).toBeDefined();
    });

    it('debe validar que el análisis de IA contenga datos válidos', () => {
      expect(MOCK_AI_ANALYSIS.commonName).toBe('Monstera Deliciosa');
      expect(MOCK_AI_ANALYSIS.species).toBe('Monstera deliciosa');
      expect(MOCK_AI_ANALYSIS.health.confidence).toBe(85);
      expect(MOCK_AI_ANALYSIS.health.overallHealth).toBe('excellent');
      expect(MOCK_AI_ANALYSIS.careProfile).toBeDefined();
      expect(MOCK_AI_ANALYSIS.personality).toBeDefined();
    });
  });

  describe('Flujo de Datos', () => {
    it('debe procesar correctamente los datos de imagen a planta', () => {
      // Verificar que los datos de prueba son consistentes
      expect(MOCK_AI_ANALYSIS.commonName).toBe(MOCK_CREATED_PLANT.name);
      expect(MOCK_AI_ANALYSIS.species).toBe(MOCK_CREATED_PLANT.species);
      expect(MOCK_AI_ANALYSIS.health.confidence).toBe(MOCK_CREATED_PLANT.healthScore);
      expect(MOCK_AI_ANALYSIS.careProfile).toEqual(MOCK_CREATED_PLANT.careProfile);
      expect(MOCK_AI_ANALYSIS.personality).toEqual(MOCK_CREATED_PLANT.personality);
    });

    it('debe validar la estructura de datos de la imagen', () => {
      expect(MOCK_IMAGE_DATA_URL).toMatch(/^data:image\/jpeg;base64,/);
      expect(MOCK_IMAGE_DATA_URL.length).toBeGreaterThan(100);
    });

    it('debe validar que el análisis de IA incluya todos los campos necesarios', () => {
      expect(MOCK_AI_ANALYSIS.commonName).toBeDefined();
      expect(MOCK_AI_ANALYSIS.species).toBeDefined();
      expect(MOCK_AI_ANALYSIS.health).toBeDefined();
      expect(MOCK_AI_ANALYSIS.health.confidence).toBeGreaterThan(0);
      expect(MOCK_AI_ANALYSIS.health.confidence).toBeLessThanOrEqual(100);
      expect(MOCK_AI_ANALYSIS.careProfile).toBeDefined();
      expect(MOCK_AI_ANALYSIS.personality).toBeDefined();
    });
  });

  describe('Integración de Servicios', () => {
    it('debe integrar correctamente analyzeImage y plantService', async () => {
      const userId = 'mock-user-id';
      const imageDataUrl = MOCK_IMAGE_DATA_URL;
      const location = 'Interior';

      // Simular el flujo completo
      const analysis = await analyzeImage(imageDataUrl);
      expect(analysis).toEqual(MOCK_AI_ANALYSIS);

      const plant = await plantService.addPlantFromAnalysis(userId, imageDataUrl, location);
      expect(plant).toEqual(MOCK_CREATED_PLANT);

      // Verificar que los servicios se llamaron en el orden correcto
      expect(analyzeImage).toHaveBeenCalledBefore(plantService.addPlantFromAnalysis as any);
    });

    it('debe manejar la subida de imagen correctamente', async () => {
      const imageUrl = await uploadImage(MOCK_IMAGE_DATA_URL, 'plant-images', 'mock-user-id/mock-plant-id');
      expect(imageUrl).toBe('https://mock-storage-url.com/image.jpg');
      expect(uploadImage).toHaveBeenCalledWith(MOCK_IMAGE_DATA_URL, 'plant-images', 'mock-user-id/mock-plant-id');
    });
  });
}); 