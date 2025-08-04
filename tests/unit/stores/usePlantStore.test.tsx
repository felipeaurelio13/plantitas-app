import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlantStore } from '../../../src/stores/usePlantStore';

// Mock services
vi.mock('../../../src/services/plantService');
vi.mock('../../../src/services/gardenCacheService');

describe('usePlantStore - Operation States', () => {
  beforeEach(() => {
    // Reset store before each test
    usePlantStore.getState().clearPlants();
    usePlantStore.getState().clearError();
  });

  describe('Initial State', () => {
    it('should initialize with correct operation states', () => {
      const { result } = renderHook(() => usePlantStore());
      
      expect(result.current.operationStates).toEqual({
        add: { isLoading: false, error: null },
        update: { isLoading: false, error: null },
        delete: { isLoading: false, error: null },
        addImage: { isLoading: false, error: null },
        chat: { isLoading: false, error: null },
      });
    });

    it('should have getOperationState method', () => {
      const { result } = renderHook(() => usePlantStore());
      
      const addState = result.current.getOperationState('add');
      expect(addState).toEqual({ isLoading: false, error: null });
    });
  });

  describe('Add Plant Operation', () => {
    it('should set loading state during add plant operation', async () => {
      const { result } = renderHook(() => usePlantStore());
      
      // Mock plantService.addPlantFromAnalysis to return a promise that we can control
      const mockPlant = { id: '1', name: 'Test Plant' };
      const addPlantPromise = new Promise(resolve => 
        setTimeout(() => resolve(mockPlant), 100)
      );
      
      vi.mocked(require('../../../src/services/plantService').PlantService.prototype.addPlantFromAnalysis)
        .mockReturnValue(addPlantPromise);

      // Start the operation
      act(() => {
        result.current.addPlant('data:image/png;base64,test', 'indoor', 'user123');
      });

      // Check loading state is active
      expect(result.current.getOperationState('add').isLoading).toBe(true);
      expect(result.current.getOperationState('add').error).toBe(null);
      expect(result.current.getOperationState('add').lastOperation).toBe('addPlant');
    });

    it('should handle add plant errors correctly', async () => {
      const { result } = renderHook(() => usePlantStore());
      
      const error = new Error('Failed to analyze image');
      vi.mocked(require('../../../src/services/plantService').PlantService.prototype.addPlantFromAnalysis)
        .mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.addPlant('invalid-data', 'indoor', 'user123');
        } catch (e) {
          // Expected to throw
        }
      });

      const addState = result.current.getOperationState('add');
      expect(addState.isLoading).toBe(false);
      expect(addState.error).toBe('Failed to analyze image');
    });
  });

  describe('Update Plant Operation', () => {
    it('should track update operation state', async () => {
      const { result } = renderHook(() => usePlantStore());
      
      const mockPlant = { id: '1', name: 'Updated Plant' };
      vi.mocked(require('../../../src/services/plantService').PlantService.prototype.updatePlant)
        .mockResolvedValue(mockPlant);

      await act(async () => {
        await result.current.updatePlant(mockPlant, 'user123');
      });

      const updateState = result.current.getOperationState('update');
      expect(updateState.isLoading).toBe(false);
      expect(updateState.error).toBe(null);
      expect(updateState.lastOperation).toBe('updatePlant-1');
    });
  });

  describe('Delete Plant Operation', () => {
    it('should track delete operation state', async () => {
      const { result } = renderHook(() => usePlantStore());
      
      vi.mocked(require('../../../src/services/plantService').PlantService.prototype.deletePlant)
        .mockResolvedValue(undefined);

      await act(async () => {
        await result.current.deletePlant('plant-123', 'user123');
      });

      const deleteState = result.current.getOperationState('delete');
      expect(deleteState.isLoading).toBe(false);
      expect(deleteState.error).toBe(null);
      expect(deleteState.lastOperation).toBe('deletePlant-plant-123');
    });
  });

  describe('Add Image Operation', () => {
    it('should track add image operation state', async () => {
      const { result } = renderHook(() => usePlantStore());
      
      const mockImage = { id: '1', url: 'test-url', timestamp: new Date() };
      vi.mocked(require('../../../src/services/plantService').PlantService.prototype.addPlantImage)
        .mockResolvedValue(mockImage);

      await act(async () => {
        await result.current.addPlantImage('plant-123', 'data:image/png;base64,test', 'user123');
      });

      const addImageState = result.current.getOperationState('addImage');
      expect(addImageState.isLoading).toBe(false);
      expect(addImageState.error).toBe(null);
      expect(addImageState.lastOperation).toBe('addImage-plant-123');
    });
  });

  describe('Error Management', () => {
    it('should clear specific operation error', () => {
      const { result } = renderHook(() => usePlantStore());
      
      // Manually set an error state for testing
      act(() => {
        usePlantStore.setState(state => ({
          ...state,
          operationStates: {
            ...state.operationStates,
            add: { isLoading: false, error: 'Test error' }
          }
        }));
      });

      expect(result.current.getOperationState('add').error).toBe('Test error');

      act(() => {
        result.current.clearError('add');
      });

      expect(result.current.getOperationState('add').error).toBe(null);
    });

    it('should clear all operation errors when no specific operation provided', () => {
      const { result } = renderHook(() => usePlantStore());
      
      // Set errors on multiple operations
      act(() => {
        usePlantStore.setState(state => ({
          ...state,
          operationStates: {
            add: { isLoading: false, error: 'Add error' },
            update: { isLoading: false, error: 'Update error' },
            delete: { isLoading: false, error: null },
            addImage: { isLoading: false, error: 'Image error' },
            chat: { isLoading: false, error: null },
          }
        }));
      });

      act(() => {
        result.current.clearError();
      });

      Object.keys(result.current.operationStates).forEach(key => {
        expect(result.current.operationStates[key as keyof typeof result.current.operationStates].error).toBe(null);
      });
    });
  });
});