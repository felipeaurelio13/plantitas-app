import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlantCardLogic, getPlantCardImageProps, getPlantCardAnimationProps } from '../../../src/hooks/usePlantCardLogic';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({
    prefetchQuery: vi.fn(),
  })),
}));

vi.mock('../../../src/lib/navigation', () => ({
  navigation: {
    plantDetail: vi.fn((id: string) => `/plant/${id}`),
    plantChat: vi.fn((id: string) => `/plant/${id}/chat`),
  },
}));

const mockPlant = {
  id: '123',
  name: 'Test Plant',
  species: 'Test Species',
  healthScore: 75,
  lastWatered: new Date('2024-01-01'),
  wateringFrequency: 3,
  profileImageUrl: 'test-image.jpg',
  images: [{ url: 'test-image.jpg' }],
} as any;

describe('usePlantCardLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('State Calculations', () => {
    it('should calculate watering needs correctly', () => {
      const plantNeedsWater = {
        ...mockPlant,
        lastWatered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        wateringFrequency: 3, // every 3 days
      };

      const { result } = renderHook(() => usePlantCardLogic(plantNeedsWater, 0));

      expect(result.current.state.needsWatering).toBe(true);
    });

    it('should calculate plant does not need watering', () => {
      const plantDoesNotNeedWater = {
        ...mockPlant,
        lastWatered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        wateringFrequency: 3, // every 3 days
      };

      const { result } = renderHook(() => usePlantCardLogic(plantDoesNotNeedWater, 0));

      expect(result.current.state.needsWatering).toBe(false);
    });

    it('should determine if plant is favorite based on health score', () => {
      const favoriteePlant = { ...mockPlant, healthScore: 85 };
      const regularPlant = { ...mockPlant, healthScore: 70 };

      const { result: favoriteResult } = renderHook(() => usePlantCardLogic(favoriteePlant, 0));
      const { result: regularResult } = renderHook(() => usePlantCardLogic(regularPlant, 0));

      expect(favoriteResult.current.state.isFavorite).toBe(true);
      expect(regularResult.current.state.isFavorite).toBe(false);
    });

    it('should calculate days since watered', () => {
      const plantWithWateringDate = {
        ...mockPlant,
        lastWatered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      };

      const { result } = renderHook(() => usePlantCardLogic(plantWithWateringDate, 0));

      expect(result.current.state.daysSinceWatered).toBe(3);
    });
  });

  describe('Health Status Calculation', () => {
    it('should return excellent status for high health scores', () => {
      const healthyPlant = { ...mockPlant, healthScore: 90 };
      const { result } = renderHook(() => usePlantCardLogic(healthyPlant, 0));

      expect(result.current.state.healthStatus.status).toBe('Excelente');
      expect(result.current.state.healthStatus.priority).toBe('low');
    });

    it('should return attention status for low health scores', () => {
      const unhealthyPlant = { ...mockPlant, healthScore: 40 };
      const { result } = renderHook(() => usePlantCardLogic(unhealthyPlant, 0));

      expect(result.current.state.healthStatus.status).toBe('Atención');
      expect(result.current.state.healthStatus.priority).toBe('high');
    });

    it('should prioritize watering urgency over health score', () => {
      const plantNeedsWaterUrgently = {
        ...mockPlant,
        healthScore: 80, // Good health
        lastWatered: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        wateringFrequency: 3,
      };

      const { result } = renderHook(() => usePlantCardLogic(plantNeedsWaterUrgently, 0));

      expect(result.current.state.healthStatus.status).toBe('Necesita agua urgente');
      expect(result.current.state.healthStatus.priority).toBe('high');
    });
  });

  describe('Actions', () => {
    it('should provide navigation functions', () => {
      const { result } = renderHook(() => usePlantCardLogic(mockPlant, 0));

      expect(typeof result.current.actions.handleClick).toBe('function');
      expect(typeof result.current.actions.navigateToPlant).toBe('function');
      expect(typeof result.current.actions.navigateToChat).toBe('function');
    });

    it('should provide prefetch function', () => {
      const { result } = renderHook(() => usePlantCardLogic(mockPlant, 0));

      expect(typeof result.current.actions.prefetchPlantData).toBe('function');
      expect(typeof result.current.actions.handleMouseEnter).toBe('function');
    });

    it('should call navigate on handleClick', () => {
      const mockNavigate = vi.fn();
      vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

      const { result } = renderHook(() => usePlantCardLogic(mockPlant, 0));

      act(() => {
        result.current.actions.handleClick();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/plant/123');
    });
  });

  describe('Prefetching', () => {
    it('should prefetch plant data on mouse enter', async () => {
      const mockPrefetchQuery = vi.fn();
      vi.mocked(require('@tanstack/react-query').useQueryClient).mockReturnValue({
        prefetchQuery: mockPrefetchQuery,
      });

      const { result } = renderHook(() => usePlantCardLogic(mockPlant, 0));

      await act(async () => {
        await result.current.actions.handleMouseEnter();
      });

      expect(mockPrefetchQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['plant', '123'],
          staleTime: 5 * 60 * 1000,
        })
      );
    });
  });
});

describe('Utility Functions', () => {
  describe('getPlantCardImageProps', () => {
    it('should return correct image props', () => {
      const props = getPlantCardImageProps(mockPlant);

      expect(props.src).toBe('test-image.jpg');
      expect(props.alt).toBe('Test Plant - Test Species');
      expect(props.className).toBe('w-full h-48 object-cover');
      expect(props.sizes).toBe('(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw');
    });

    it('should fallback to placeholder when no image', () => {
      const plantWithoutImage = { ...mockPlant, profileImageUrl: undefined, images: [] };
      const props = getPlantCardImageProps(plantWithoutImage);

      expect(props.src).toBe('/placeholder-plant.jpg');
    });

    it('should use first image if no profile image', () => {
      const plantWithImages = {
        ...mockPlant,
        profileImageUrl: undefined,
        images: [{ url: 'first-image.jpg' }, { url: 'second-image.jpg' }],
      };
      const props = getPlantCardImageProps(plantWithImages);

      expect(props.src).toBe('first-image.jpg');
    });
  });

  describe('getPlantCardAnimationProps', () => {
    it('should return animation props with correct delay', () => {
      const props = getPlantCardAnimationProps(2);

      expect(props.initial).toEqual({ opacity: 0, y: 20 });
      expect(props.animate).toEqual({ opacity: 1, y: 0 });
      expect(props.transition.delay).toBe(0.2); // 2 * 0.1
    });

    it('should cap delay to prevent very long delays', () => {
      const props = getPlantCardAnimationProps(10);

      expect(props.transition.delay).toBe(0.5); // Capped to max
    });

    it('should include hover and tap animations', () => {
      const props = getPlantCardAnimationProps(0);

      expect(props.whileHover).toEqual({
        y: -4,
        transition: { duration: 0.2 }
      });
      expect(props.whileTap).toEqual({
        scale: 0.98,
        transition: { duration: 0.1 }
      });
    });
  });
});