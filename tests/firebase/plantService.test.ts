import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getUserPlants,
  getPlantById,
  createPlant,
  updatePlant,
  deletePlant,
  addChatMessage,
  addPlantImage,
  updatePlantHealthScore,
} from '../../src/services/plantService';

// Mock Firebase functions
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockGetDocs = vi.fn();
const mockWriteBatch = vi.fn();
const mockServerTimestamp = vi.fn();

// Mock data
const mockPlant = {
  id: 'plant-123',
  userId: 'user-123',
  name: 'My Monstera',
  species: 'Monstera deliciosa',
  location: 'Living Room',
  healthScore: 85,
  careProfile: {},
  personality: {},
  dateAdded: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
};

const mockChatMessage = {
  plantId: 'plant-123',
  userId: 'user-123',
  sender: 'user' as const,
  content: 'How are you doing?',
};

const mockPlantImage = {
  plantId: 'plant-123',
  userId: 'user-123',
  storagePath: 'images/plant-123/image-123.jpg',
  healthAnalysis: {},
  isProfileImage: false,
  url: 'https://example.com/image.jpg',
  createdAt: new Date(),
};

vi.mock('../../src/lib/firebase', () => ({
  db: {},
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  getDocs: mockGetDocs,
  writeBatch: mockWriteBatch,
  serverTimestamp: mockServerTimestamp,
  firestoreHelpers: {
    getCollection: vi.fn(),
    getDocRef: vi.fn(),
  },
}));

describe('Firebase Plant Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mock implementations
    mockServerTimestamp.mockReturnValue({ serverTimestamp: true });
    mockCollection.mockReturnValue('mock-collection-ref');
    mockDoc.mockReturnValue('mock-doc-ref');
    mockQuery.mockReturnValue('mock-query-ref');
    mockWhere.mockReturnValue('mock-where-constraint');
    mockOrderBy.mockReturnValue('mock-orderby-constraint');
    mockLimit.mockReturnValue('mock-limit-constraint');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserPlants', () => {
    it('should fetch all plants for a user', async () => {
      const mockPlantsSnapshot = {
        docs: [
          {
            id: 'plant-123',
            data: () => ({
              ...mockPlant,
              id: undefined, // Remove id from data as it comes from doc.id
            }),
          },
        ],
      };

      const mockProfileImageSnapshot = {
        empty: false,
        docs: [
          {
            id: 'image-123',
            data: () => mockPlantImage,
          },
        ],
      };

      mockGetDocs
        .mockResolvedValueOnce(mockPlantsSnapshot)
        .mockResolvedValueOnce(mockProfileImageSnapshot);

      const result = await getUserPlants('user-123');

      expect(mockCollection).toHaveBeenCalledWith({}, 'plants');
      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-123');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'plant-123',
        name: 'My Monstera',
        profileImage: expect.objectContaining({
          id: 'image-123',
        }),
      });
    });

    it('should handle empty plant list', async () => {
      const mockEmptySnapshot = { docs: [] };
      mockGetDocs.mockResolvedValueOnce(mockEmptySnapshot);

      const result = await getUserPlants('user-123');

      expect(result).toEqual([]);
    });

    it('should handle Firebase not initialized', async () => {
      vi.mocked(vi.doMock('../../src/lib/firebase', () => ({
        db: null,
      })));

      await expect(getUserPlants('user-123')).rejects.toThrow(
        'Firebase Firestore not initialized'
      );
    });

    it('should handle Firestore errors', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Firestore error'));

      await expect(getUserPlants('user-123')).rejects.toThrow('Firestore error');
    });
  });

  describe('getPlantById', () => {
    it('should fetch a plant by ID with subcollections', async () => {
      const mockPlantDoc = {
        exists: () => true,
        id: 'plant-123',
        data: () => mockPlant,
      };

      const mockSubcollectionSnapshot = {
        docs: [{ id: 'sub-123', data: () => ({ content: 'test' }) }],
      };

      mockGetDoc.mockResolvedValueOnce(mockPlantDoc);
      mockGetDocs
        .mockResolvedValueOnce(mockSubcollectionSnapshot) // images
        .mockResolvedValueOnce(mockSubcollectionSnapshot) // messages
        .mockResolvedValueOnce(mockSubcollectionSnapshot); // notifications

      const result = await getPlantById('plant-123');

      expect(mockGetDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(result).toMatchObject({
        id: 'plant-123',
        name: 'My Monstera',
        images: expect.any(Array),
        chatMessages: expect.any(Array),
        notifications: expect.any(Array),
      });
    });

    it('should return null for non-existent plant', async () => {
      const mockPlantDoc = {
        exists: () => false,
      };

      mockGetDoc.mockResolvedValueOnce(mockPlantDoc);

      const result = await getPlantById('non-existent');

      expect(result).toBeNull();
    });

    it('should fetch plant without subcollections when specified', async () => {
      const mockPlantDoc = {
        exists: () => true,
        id: 'plant-123',
        data: () => mockPlant,
      };

      mockGetDoc.mockResolvedValueOnce(mockPlantDoc);

      const result = await getPlantById('plant-123', false);

      expect(mockGetDocs).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'plant-123',
        name: 'My Monstera',
      });
      expect(result?.images).toBeUndefined();
    });
  });

  describe('createPlant', () => {
    it('should create a new plant', async () => {
      const newPlantData = {
        ...mockPlant,
        id: undefined as any, // Remove id for creation
      };
      delete newPlantData.id;

      const mockNewDoc = { id: 'new-plant-123' };
      mockAddDoc.mockResolvedValueOnce(mockNewDoc);

      const result = await createPlant(newPlantData);

      expect(mockCollection).toHaveBeenCalledWith({}, 'plants');
      expect(mockAddDoc).toHaveBeenCalledWith(
        'mock-collection-ref',
        expect.objectContaining({
          ...newPlantData,
          createdAt: { serverTimestamp: true },
          updatedAt: { serverTimestamp: true },
          healthScore: 85,
          dateAdded: expect.any(Date),
        })
      );
      expect(result).toBe('new-plant-123');
    });

    it('should handle creation errors', async () => {
      const newPlantData = { ...mockPlant };
      delete (newPlantData as any).id;

      mockAddDoc.mockRejectedValueOnce(new Error('Creation failed'));

      await expect(createPlant(newPlantData)).rejects.toThrow('Creation failed');
    });
  });

  describe('updatePlant', () => {
    it('should update plant data', async () => {
      const updates = { name: 'Updated Plant Name', healthScore: 90 };

      mockUpdateDoc.mockResolvedValueOnce(undefined);

      await updatePlant('plant-123', updates);

      expect(mockDoc).toHaveBeenCalledWith({}, 'plants', 'plant-123');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
        ...updates,
        updatedAt: { serverTimestamp: true },
      });
    });

    it('should handle update errors', async () => {
      mockUpdateDoc.mockRejectedValueOnce(new Error('Update failed'));

      await expect(
        updatePlant('plant-123', { name: 'New Name' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deletePlant', () => {
    it('should delete plant and subcollections', async () => {
      const mockBatch = {
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      const mockSubcollectionSnapshot = {
        docs: [
          { ref: 'doc-ref-1' },
          { ref: 'doc-ref-2' },
        ],
      };

      mockWriteBatch.mockReturnValue(mockBatch);
      mockGetDocs.mockResolvedValue(mockSubcollectionSnapshot);
      mockDeleteDoc.mockResolvedValueOnce(undefined);

      await deletePlant('plant-123');

      expect(mockWriteBatch).toHaveBeenCalled();
      expect(mockBatch.delete).toHaveBeenCalledTimes(6); // 2 docs × 3 subcollections
      expect(mockBatch.commit).toHaveBeenCalledTimes(3); // 3 subcollections
      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('should handle deletion errors', async () => {
      mockDeleteDoc.mockRejectedValueOnce(new Error('Deletion failed'));

      await expect(deletePlant('plant-123')).rejects.toThrow('Deletion failed');
    });
  });

  describe('addChatMessage', () => {
    it('should add a chat message', async () => {
      const mockNewDoc = { id: 'message-123' };
      mockAddDoc.mockResolvedValueOnce(mockNewDoc);

      const result = await addChatMessage('plant-123', mockChatMessage);

      expect(mockCollection).toHaveBeenCalledWith(
        {},
        'plants',
        'plant-123',
        'chat_messages'
      );
      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection-ref', {
        ...mockChatMessage,
        createdAt: { serverTimestamp: true },
      });
      expect(result).toBe('message-123');
    });

    it('should handle chat message errors', async () => {
      mockAddDoc.mockRejectedValueOnce(new Error('Message failed'));

      await expect(
        addChatMessage('plant-123', mockChatMessage)
      ).rejects.toThrow('Message failed');
    });
  });

  describe('addPlantImage', () => {
    it('should add a plant image', async () => {
      const mockNewDoc = { id: 'image-123' };
      mockAddDoc.mockResolvedValueOnce(mockNewDoc);

      const result = await addPlantImage('plant-123', mockPlantImage);

      expect(mockCollection).toHaveBeenCalledWith(
        {},
        'plants',
        'plant-123',
        'plant_images'
      );
      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection-ref', {
        ...mockPlantImage,
        createdAt: { serverTimestamp: true },
      });
      expect(result).toBe('image-123');
    });
  });

  describe('updatePlantHealthScore', () => {
    it('should update plant health score', async () => {
      mockUpdateDoc.mockResolvedValueOnce(undefined);

      await updatePlantHealthScore('plant-123', 95);

      expect(mockDoc).toHaveBeenCalledWith({}, 'plants', 'plant-123');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
        healthScore: 95,
        updatedAt: { serverTimestamp: true },
      });
    });

    it('should handle health score update errors', async () => {
      mockUpdateDoc.mockRejectedValueOnce(new Error('Health update failed'));

      await expect(updatePlantHealthScore('plant-123', 95)).rejects.toThrow(
        'Health update failed'
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw when Firebase not initialized', async () => {
      // Mock Firebase not available
      vi.mocked(vi.doMock('../../src/lib/firebase', () => ({
        db: null,
      })));

      await expect(getUserPlants('user-123')).rejects.toThrow(
        'Firebase Firestore not initialized'
      );
    });

    it('should log errors appropriately', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetDocs.mockRejectedValueOnce(new Error('Database error'));

      await expect(getUserPlants('user-123')).rejects.toThrow('Database error');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PLANT SERVICE] Error fetching user plants:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Firebase Security Rules Simulation', () => {
    it('should handle permission denied errors', async () => {
      const permissionError = new Error('Missing or insufficient permissions');
      permissionError.name = 'FirebaseError';
      (permissionError as any).code = 'permission-denied';

      mockGetDocs.mockRejectedValueOnce(permissionError);

      await expect(getUserPlants('user-123')).rejects.toThrow(
        'Missing or insufficient permissions'
      );
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'FirebaseError';
      (networkError as any).code = 'unavailable';

      mockGetDocs.mockRejectedValueOnce(networkError);

      await expect(getUserPlants('user-123')).rejects.toThrow(
        'Network request failed'
      );
    });
  });
});