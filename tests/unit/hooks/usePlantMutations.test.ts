import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePlantMutations } from '../../../src/hooks/usePlantMutations';
import { Plant } from '../../../src/schemas';

// Mock de servicios
vi.mock('../../../src/services/plantService', () => ({
  plantService: {
    addPlantImage: vi.fn(),
    updatePlantHealthScore: vi.fn(),
    updatePlantInfo: vi.fn()
  }
}));

vi.mock('../../../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

vi.mock('../../../src/components/ui/Toast', () => ({
  useToast: () => ({
    addToast: vi.fn()
  })
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

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePlantMutations Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return mutation functions', () => {
    const { result } = renderHook(() => usePlantMutations(), {
      wrapper: TestWrapper
    });

    expect(result.current.addPlantImage).toBeDefined();
    expect(result.current.updatePlantHealthMutation).toBeDefined();
    expect(result.current.isAddingImage).toBe(false);
    expect(result.current.isUpdatingPlantHealth).toBe(false);
  });

  it('should handle addPlantImage mutation', async () => {
    const { plantService } = await import('../../../src/services/plantService');
    (plantService.addPlantImage as any).mockResolvedValue({
      id: 'new-image-id',
      url: 'https://example.com/new-image.jpg'
    });

    const { result } = renderHook(() => usePlantMutations(), {
      wrapper: TestWrapper
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

    await result.current.addPlantImage.mutateAsync(imageData);

    expect(plantService.addPlantImage).toHaveBeenCalledWith(imageData);
  });

  it('should handle updatePlantHealthMutation', async () => {
    const { plantService } = await import('../../../src/services/plantService');
    (plantService.updatePlantHealthScore as any).mockResolvedValue(90);

    const { result } = renderHook(() => usePlantMutations(), {
      wrapper: TestWrapper
    });

    const updateData = {
      plant: mockPlant,
      userId: 'test-user'
    };

    await result.current.updatePlantHealthMutation.mutateAsync(updateData);

    expect(plantService.updatePlantHealthScore).toHaveBeenCalledWith(updateData);
  });

  it('should handle loading states correctly', async () => {
    const { plantService } = await import('../../../src/services/plantService');
    (plantService.addPlantImage as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => usePlantMutations(), {
      wrapper: TestWrapper
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

    // Iniciar mutación
    result.current.addPlantImage.mutate(imageData);

    // Verificar estado de carga
    expect(result.current.isAddingImage).toBe(true);

    // Esperar a que termine
    await waitFor(() => {
      expect(result.current.isAddingImage).toBe(false);
    });
  });

  it('should handle error states', async () => {
    const { plantService } = await import('../../../src/services/plantService');
    const mockError = new Error('Failed to add image');
    (plantService.addPlantImage as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => usePlantMutations(), {
      wrapper: TestWrapper
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

    try {
      await result.current.addPlantImage.mutateAsync(imageData);
    } catch (error) {
      expect(error).toEqual(mockError);
    }

    expect(result.current.addPlantImage.error).toBeDefined();
  });

  it('should handle success callbacks', async () => {
    const { plantService } = await import('../../../src/services/plantService');
    const mockResponse = {
      id: 'new-image-id',
      url: 'https://example.com/new-image.jpg'
    };
    (plantService.addPlantImage as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePlantMutations(), {
      wrapper: TestWrapper
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

    const response = await result.current.addPlantImage.mutateAsync(imageData);
    expect(response).toEqual(mockResponse);
  });

  it('should handle invalid data gracefully', async () => {
    const { result } = renderHook(() => usePlantMutations(), {
      wrapper: TestWrapper
    });

    // Intentar con datos inválidos
    const invalidData = {
      plantId: '',
      imageFile: null as any,
      healthAnalysis: null as any
    };

    try {
      await result.current.addPlantImage.mutateAsync(invalidData);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should reset error state on new mutation', async () => {
    const { plantService } = await import('../../../src/services/plantService');
    const mockError = new Error('Failed to add image');
    (plantService.addPlantImage as any).mockRejectedValueOnce(mockError);
    (plantService.addPlantImage as any).mockResolvedValueOnce({
      id: 'new-image-id',
      url: 'https://example.com/new-image.jpg'
    });

    const { result } = renderHook(() => usePlantMutations(), {
      wrapper: TestWrapper
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

    // Primera mutación que falla
    try {
      await result.current.addPlantImage.mutateAsync(imageData);
    } catch (error) {
      expect(error).toEqual(mockError);
    }

    // Segunda mutación que tiene éxito
    const response = await result.current.addPlantImage.mutateAsync(imageData);
    expect(response).toBeDefined();
    expect(result.current.addPlantImage.error).toBeNull();
  });
}); 