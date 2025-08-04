import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePlantDetail } from '../../../src/hooks/usePlantDetail';
import { Plant } from '../../../src/schemas';

// Mock de servicios
vi.mock('../../../src/services/plantService', () => ({
  plantService: {
    getPlantById: vi.fn()
  }
}));

vi.mock('../../../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

const mockPlant: Plant = {
  id: 'test-plant-1',
  name: 'Monstera Deliciosa',
  species: 'Monstera deliciosa',
  nickname: 'Monstera',
  description: 'Una hermosa planta tropical',
  funFacts: ['Es nativa de México', 'Puede crecer hasta 20 metros'],
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

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('usePlantDetail Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => usePlantDetail('test-plant-1'), {
      wrapper: TestWrapper
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.plant).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should return plant data when successful', async () => {
    const { plantService } = await import('../../../src/services/plantService');
    (plantService.getPlantById as any).mockResolvedValue(mockPlant);

    const { result } = renderHook(() => usePlantDetail('test-plant-1'), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plant).toEqual(mockPlant);
    expect(result.current.error).toBeNull();
  });

  it('should return error when API call fails', async () => {
    const { plantService } = await import('../../../src/services/plantService');
    const mockError = new Error('Failed to fetch plant');
    (plantService.getPlantById as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => usePlantDetail('test-plant-1'), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plant).toBeNull();
    expect(result.current.error).toBeDefined();
  });

  it('should refetch data when plantId changes', async () => {
    const { plantService } = await import('../../../src/services/plantService');
    (plantService.getPlantById as any).mockResolvedValue(mockPlant);

    const { result, rerender } = renderHook(
      ({ plantId }) => usePlantDetail(plantId),
      {
        wrapper: TestWrapper,
        initialProps: { plantId: 'test-plant-1' }
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Cambiar plantId
    rerender({ plantId: 'test-plant-2' });

    // Debería estar cargando de nuevo
    expect(result.current.isLoading).toBe(true);
    expect(plantService.getPlantById).toHaveBeenCalledTimes(2);
  });

  it('should handle empty plantId gracefully', () => {
    const { result } = renderHook(() => usePlantDetail(''), {
      wrapper: TestWrapper
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.plant).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should cache results for the same plantId', async () => {
    const { plantService } = await import('../../../src/services/plantService');
    (plantService.getPlantById as any).mockResolvedValue(mockPlant);

    const { result, rerender } = renderHook(
      ({ plantId }) => usePlantDetail(plantId),
      {
        wrapper: TestWrapper,
        initialProps: { plantId: 'test-plant-1' }
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Rerender con el mismo plantId
    rerender({ plantId: 'test-plant-1' });

    // No debería hacer otra llamada a la API
    expect(plantService.getPlantById).toHaveBeenCalledTimes(1);
  });
}); 