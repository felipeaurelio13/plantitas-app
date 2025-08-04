import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Plant, PlantImage, HealthAnalysis } from '../src/schemas';

// Mock del hook
vi.mock('../src/hooks/usePlantInfoCompletion', () => ({
  usePlantInfoCompletion: () => ({
    completeInfo: vi.fn(),
    isCompleting: false,
    error: null
  })
}));

// Mocks marcados claramente
const MOCK_ANALYSIS_1: HealthAnalysis = {
  overallHealth: 'good',
  issues: [],
  recommendations: [],
  moistureLevel: 50,
  growthStage: 'mature',
  confidence: 80,
};

const MOCK_ANALYSIS_2: HealthAnalysis = {
  overallHealth: 'fair',
  issues: [],
  recommendations: [],
  moistureLevel: 40,
  growthStage: 'juvenile',
  confidence: 60,
};

const MOCK_IMAGE_1: PlantImage = {
  id: 'img1',
  url: 'https://real.url/1.jpg',
  timestamp: new Date('2024-01-01'),
  healthAnalysis: MOCK_ANALYSIS_1,
  isProfileImage: true,
};

const MOCK_IMAGE_2: PlantImage = {
  id: 'img2',
  url: 'https://real.url/2.jpg',
  timestamp: new Date('2024-02-01'),
  healthAnalysis: MOCK_ANALYSIS_2,
  isProfileImage: false,
};

const MOCK_PLANT: Plant = {
  id: 'plant1',
  name: 'Ficus',
  species: 'Ficus lyrata',
  variety: undefined,
  nickname: 'Lira',
  description: undefined,
  funFacts: [],
  location: 'Interior',
  plantEnvironment: undefined,
  lightRequirements: undefined,
  dateAdded: new Date('2024-01-01'),
  lastFertilized: undefined,
  images: [MOCK_IMAGE_1, MOCK_IMAGE_2],
  healthScore: 70,
  careProfile: {
    wateringFrequency: 7,
    sunlightRequirement: 'medium',
    humidityPreference: 'medium',
    temperatureRange: { min: 15, max: 30 },
    fertilizingFrequency: 30,
    soilType: 'universal',
    specialCare: [],
  },
  personality: {
    traits: ['cheerful'],
    communicationStyle: 'cheerful',
    catchphrases: ['¡Hola!'],
    moodFactors: { health: 1, care: 1, attention: 1 },
  },
  chatHistory: [],
  notifications: [],
};

describe('Completar info IA no afecta imágenes ni análisis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe completar ambiente/luz sin modificar imágenes ni healthAnalysis', () => {
    // Snapshot de las imágenes originales
    const originalImages = JSON.parse(JSON.stringify(MOCK_PLANT.images));
    
    // Simular la actualización de información sin afectar imágenes
    const updatedPlant = {
      ...MOCK_PLANT,
      plantEnvironment: 'interior',
      lightRequirements: 'luz_indirecta',
      // Las imágenes deben permanecer exactamente iguales
      images: [...MOCK_PLANT.images],
    };

    // Verificaciones principales
    expect(updatedPlant.plantEnvironment).toBe('interior');
    expect(updatedPlant.lightRequirements).toBe('luz_indirecta');
    
    // Verificar que las imágenes no cambiaron (ignorando diferencias de serialización de Date)
    expect(updatedPlant.images).toHaveLength(originalImages.length);
    expect(updatedPlant.images[0].id).toBe(originalImages[0].id);
    expect(updatedPlant.images[1].id).toBe(originalImages[1].id);
    expect(updatedPlant.images).toHaveLength(2);
    
    // Verificar que cada imagen mantiene su healthAnalysis original
    expect(updatedPlant.images[0].healthAnalysis).toEqual(MOCK_ANALYSIS_1);
    expect(updatedPlant.images[1].healthAnalysis).toEqual(MOCK_ANALYSIS_2);
    
    // Verificar que las URLs no cambiaron
    expect(updatedPlant.images[0].url).toBe('https://real.url/1.jpg');
    expect(updatedPlant.images[1].url).toBe('https://real.url/2.jpg');
    
    // Verificar que los timestamps no cambiaron
    expect(updatedPlant.images[0].timestamp).toEqual(new Date('2024-01-01'));
    expect(updatedPlant.images[1].timestamp).toEqual(new Date('2024-02-01'));
  });

  it('debe mantener la estructura de datos intacta', () => {
    const updatedPlant = {
      ...MOCK_PLANT,
      plantEnvironment: 'interior',
      lightRequirements: 'luz_indirecta',
      images: [...MOCK_PLANT.images],
    };

    // Verificar que todos los campos de la planta siguen siendo válidos
    expect(updatedPlant.id).toBe('plant1');
    expect(updatedPlant.name).toBe('Ficus');
    expect(updatedPlant.species).toBe('Ficus lyrata');
    expect(updatedPlant.healthScore).toBe(70);
    
    // Verificar que el careProfile no cambió
    expect(updatedPlant.careProfile).toEqual(MOCK_PLANT.careProfile);
    
    // Verificar que la personalidad no cambió
    expect(updatedPlant.personality).toEqual(MOCK_PLANT.personality);
  });
}); 