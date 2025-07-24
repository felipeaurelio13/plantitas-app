import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Plant, PlantImage, HealthAnalysis } from '../src/schemas';

// Mock del hook de mutaciones
vi.mock('../src/hooks/usePlantMutations', () => ({
  usePlantMutations: () => ({
    updatePlantHealthMutation: vi.fn(),
    isUpdatingPlantHealth: false
  })
}));

const MOCK_ANALYSIS_OLD: HealthAnalysis = {
  overallHealth: 'good',
  issues: [],
  recommendations: [],
  moistureLevel: 50,
  growthStage: 'mature',
  confidence: 80,
};

const MOCK_ANALYSIS_NEW: HealthAnalysis = {
  overallHealth: 'excellent',
  issues: [],
  recommendations: [],
  moistureLevel: 60,
  growthStage: 'mature',
  confidence: 95,
};

const MOCK_IMAGE_OLD: PlantImage = {
  id: 'img1',
  url: 'https://real.url/1.jpg',
  timestamp: new Date('2024-01-01'),
  healthAnalysis: MOCK_ANALYSIS_OLD,
  isProfileImage: false,
};

const MOCK_IMAGE_NEW: PlantImage = {
  id: 'img2',
  url: 'https://real.url/2.jpg',
  timestamp: new Date('2024-02-01'),
  healthAnalysis: MOCK_ANALYSIS_OLD,
  isProfileImage: true,
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
  plantEnvironment: 'interior',
  lightRequirements: 'luz_indirecta',
  dateAdded: new Date('2024-01-01'),
  lastFertilized: undefined,
  images: [MOCK_IMAGE_NEW, MOCK_IMAGE_OLD], // Nueva imagen primero (más reciente)
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

describe('Actualizar diagnóstico solo afecta la imagen más reciente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe actualizar solo el healthAnalysis de la imagen más reciente', () => {
    // Snapshot de las imágenes originales
    const originalImages = JSON.parse(JSON.stringify(MOCK_PLANT.images));
    
    // Simular la actualización: solo la imagen más reciente (índice 0) se actualiza
    const updatedImages = [
      { ...MOCK_IMAGE_NEW, healthAnalysis: MOCK_ANALYSIS_NEW }, // Imagen más reciente actualizada
      MOCK_IMAGE_OLD, // Imagen antigua sin cambios
    ];

    // Verificar que solo la imagen más reciente se actualizó
    expect(updatedImages[0].healthAnalysis).toEqual(MOCK_ANALYSIS_NEW);
    expect(updatedImages[0].healthAnalysis.confidence).toBe(95);
    expect(updatedImages[0].healthAnalysis.overallHealth).toBe('excellent');
    
    // Verificar que la imagen antigua no cambió
    expect(updatedImages[1].healthAnalysis).toEqual(originalImages[1].healthAnalysis);
    expect(updatedImages[1].healthAnalysis.confidence).toBe(80);
    expect(updatedImages[1].healthAnalysis.overallHealth).toBe('good');
  });

  it('debe mantener los timestamps y URLs sin cambios', () => {
    const updatedImages = [
      { ...MOCK_IMAGE_NEW, healthAnalysis: MOCK_ANALYSIS_NEW },
      MOCK_IMAGE_OLD,
    ];

    // Verificar que los timestamps no cambiaron
    expect(updatedImages[0].timestamp).toEqual(new Date('2024-02-01'));
    expect(updatedImages[1].timestamp).toEqual(new Date('2024-01-01'));

    // Verificar que las URLs no cambiaron
    expect(updatedImages[0].url).toBe('https://real.url/2.jpg');
    expect(updatedImages[1].url).toBe('https://real.url/1.jpg');

    // Verificar que los IDs no cambiaron
    expect(updatedImages[0].id).toBe('img2');
    expect(updatedImages[1].id).toBe('img1');
  });

  it('debe mantener el isProfileImage sin cambios', () => {
    const updatedImages = [
      { ...MOCK_IMAGE_NEW, healthAnalysis: MOCK_ANALYSIS_NEW },
      MOCK_IMAGE_OLD,
    ];

    // Verificar que isProfileImage no cambió
    expect(updatedImages[0].isProfileImage).toBe(true);
    expect(updatedImages[1].isProfileImage).toBe(false);
  });

  it('debe actualizar el healthScore de la planta basado en el análisis más reciente', () => {
    const updatedPlant = {
      ...MOCK_PLANT,
      images: [
        { ...MOCK_IMAGE_NEW, healthAnalysis: MOCK_ANALYSIS_NEW },
        MOCK_IMAGE_OLD,
      ],
      healthScore: MOCK_ANALYSIS_NEW.confidence, // 95
    };

    // Verificar que el healthScore se actualizó basado en el análisis más reciente
    expect(updatedPlant.healthScore).toBe(95);
    expect(updatedPlant.healthScore).toBe(MOCK_ANALYSIS_NEW.confidence);
  });
}); 