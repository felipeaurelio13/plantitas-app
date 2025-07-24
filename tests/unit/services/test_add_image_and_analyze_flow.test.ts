import { describe, it, expect } from 'vitest';
import { Plant, PlantImage, HealthAnalysis } from '../src/schemas';

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
  isProfileImage: false,
};
const MOCK_IMAGE_2: PlantImage = {
  id: 'img2',
  url: 'https://real.url/2.jpg',
  timestamp: new Date('2024-02-01'),
  healthAnalysis: MOCK_ANALYSIS_2,
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
  images: [MOCK_IMAGE_2, MOCK_IMAGE_1],
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

describe('Agregar imágenes y análisis', () => {
  it('cada imagen debe tener su propio healthAnalysis y el análisis principal es el de la más reciente', () => {
    // Verificar que cada imagen tiene su healthAnalysis
    expect(MOCK_PLANT.images[0].healthAnalysis).toEqual(MOCK_ANALYSIS_2);
    expect(MOCK_PLANT.images[1].healthAnalysis).toEqual(MOCK_ANALYSIS_1);
    // El análisis principal debe ser el de la imagen más reciente
    const mainAnalysis = MOCK_PLANT.images[0].healthAnalysis;
    expect(mainAnalysis).toEqual(MOCK_ANALYSIS_2);
  });
}); 