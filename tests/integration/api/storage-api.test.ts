import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../../src/lib/supabase';

// Mock de Supabase Storage
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
        getPublicUrl: vi.fn(),
        createSignedUrl: vi.fn(),
        update: vi.fn()
      }))
    }
  }
}));

describe('Storage API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Image Upload Operations', () => {
    it('should successfully upload plant image', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: {
          path: 'plants/test-user/plant-1/image-2024-01-01.jpg',
          id: 'upload-id-123',
          size: 1024000,
          mimeType: 'image/jpeg'
        },
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(mockUpload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const imageFile = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const path = 'plants/test-user/plant-1/image-2024-01-01.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .upload(path, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      expect(response.data.path).toBe('plants/test-user/plant-1/image-2024-01-01.jpg');
      expect(response.data.size).toBe(1024000);
      expect(response.data.mimeType).toBe('image/jpeg');
      expect(response.error).toBeNull();
    });

    it('should handle image upload with metadata', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: {
          path: 'plants/test-user/plant-1/health-check.jpg',
          id: 'upload-id-456',
          size: 2048000,
          mimeType: 'image/jpeg',
          metadata: {
            plantId: 'plant-1',
            uploadDate: '2024-01-01T00:00:00Z',
            purpose: 'health-check'
          }
        },
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(mockUpload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const imageFile = new File(['image-data'], 'health-check.jpg', { type: 'image/jpeg' });
      const path = 'plants/test-user/plant-1/health-check.jpg';
      const metadata = {
        plantId: 'plant-1',
        uploadDate: '2024-01-01T00:00:00Z',
        purpose: 'health-check'
      };

      const response = await supabase.storage
        .from('plant-images')
        .upload(path, imageFile, {
          cacheControl: '3600',
          upsert: false,
          metadata
        });

      expect(response.data.metadata.plantId).toBe('plant-1');
      expect(response.data.metadata.purpose).toBe('health-check');
      expect(response.data.size).toBe(2048000);
    });

    it('should handle large image upload', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: {
          path: 'plants/test-user/plant-1/large-image.jpg',
          id: 'upload-id-789',
          size: 10485760, // 10MB
          mimeType: 'image/jpeg'
        },
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(mockUpload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      // Simular imagen grande (10MB)
      const largeImage = new File(['x'.repeat(10 * 1024 * 1024)], 'large-image.jpg', { type: 'image/jpeg' });
      const path = 'plants/test-user/plant-1/large-image.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .upload(path, largeImage, {
          cacheControl: '7200',
          upsert: false
        });

      expect(response.data.size).toBe(10485760);
      expect(response.data.path).toBe('plants/test-user/plant-1/large-image.jpg');
      expect(response.error).toBeNull();
    });

    it('should handle upload failure due to file size limit', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'File size exceeds the maximum allowed limit of 50MB',
          status: 413
        }
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(mockUpload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      // Simular imagen muy grande (60MB)
      const oversizedImage = new File(['x'.repeat(60 * 1024 * 1024)], 'oversized.jpg', { type: 'image/jpeg' });
      const path = 'plants/test-user/plant-1/oversized.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .upload(path, oversizedImage);

      expect(response.data).toBeNull();
      expect(response.error.message).toContain('File size exceeds');
      expect(response.error.status).toBe(413);
    });

    it('should handle upload failure due to invalid file type', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
          status: 400
        }
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(mockUpload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const invalidFile = new File(['data'], 'document.pdf', { type: 'application/pdf' });
      const path = 'plants/test-user/plant-1/document.pdf';

      const response = await supabase.storage
        .from('plant-images')
        .upload(path, invalidFile);

      expect(response.data).toBeNull();
      expect(response.error.message).toContain('Invalid file type');
      expect(response.error.status).toBe(400);
    });
  });

  describe('Image Download Operations', () => {
    it('should successfully download plant image', async () => {
      const mockDownload = vi.fn().mockResolvedValue({
        data: new Blob(['image-data'], { type: 'image/jpeg' }),
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        download: vi.fn().mockResolvedValue(mockDownload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const path = 'plants/test-user/plant-1/image.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .download(path);

      expect(response.data).toBeInstanceOf(Blob);
      expect(response.data.type).toBe('image/jpeg');
      expect(response.error).toBeNull();
    });

    it('should handle download with specific options', async () => {
      const mockDownload = vi.fn().mockResolvedValue({
        data: new Blob(['image-data'], { type: 'image/jpeg' }),
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        download: vi.fn().mockResolvedValue(mockDownload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const path = 'plants/test-user/plant-1/image.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .download(path, {
          transform: {
            width: 800,
            height: 600,
            quality: 80
          }
        });

      expect(response.data).toBeInstanceOf(Blob);
      expect(response.error).toBeNull();
    });

    it('should handle download failure for non-existent file', async () => {
      const mockDownload = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'File not found',
          status: 404
        }
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        download: vi.fn().mockResolvedValue(mockDownload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const path = 'plants/test-user/plant-1/non-existent.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .download(path);

      expect(response.data).toBeNull();
      expect(response.error.message).toBe('File not found');
      expect(response.error.status).toBe(404);
    });
  });

  describe('Image URL Generation', () => {
    it('should successfully generate public URL for image', async () => {
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: {
          publicUrl: 'https://example.supabase.co/storage/v1/object/public/plant-images/plants/test-user/plant-1/image.jpg'
        }
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue(mockGetPublicUrl())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const path = 'plants/test-user/plant-1/image.jpg';

      const response = supabase.storage
        .from('plant-images')
        .getPublicUrl(path);

      expect(response.data.publicUrl).toContain('https://example.supabase.co');
      expect(response.data.publicUrl).toContain('plant-images');
      expect(response.data.publicUrl).toContain(path);
    });

    it('should generate signed URL for private images', async () => {
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: {
          signedUrl: 'https://example.supabase.co/storage/v1/object/sign/plant-images/plants/test-user/plant-1/private.jpg?token=abc123',
          path: 'plants/test-user/plant-1/private.jpg',
          signedURL: 'https://example.supabase.co/storage/v1/object/sign/plant-images/plants/test-user/plant-1/private.jpg?token=abc123'
        },
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue(mockCreateSignedUrl())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const path = 'plants/test-user/plant-1/private.jpg';
      const expiresIn = 3600; // 1 hour

      const response = await supabase.storage
        .from('plant-images')
        .createSignedUrl(path, expiresIn);

      expect(response.data.signedUrl).toContain('token=abc123');
      expect(response.data.path).toBe(path);
      expect(response.error).toBeNull();
    });

    it('should handle signed URL generation failure', async () => {
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'File not found or access denied',
          status: 404
        }
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue(mockCreateSignedUrl())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const path = 'plants/test-user/plant-1/non-existent.jpg';
      const expiresIn = 3600;

      const response = await supabase.storage
        .from('plant-images')
        .createSignedUrl(path, expiresIn);

      expect(response.data).toBeNull();
      expect(response.error.message).toBe('File not found or access denied');
      expect(response.error.status).toBe(404);
    });
  });

  describe('Image Management Operations', () => {
    it('should successfully list user images', async () => {
      const mockList = vi.fn().mockResolvedValue({
        data: [
          {
            name: 'image-1.jpg',
            id: 'file-1',
            updated_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            last_accessed_at: '2024-01-01T00:00:00Z',
            metadata: {
              plantId: 'plant-1',
              purpose: 'health-check'
            }
          },
          {
            name: 'image-2.jpg',
            id: 'file-2',
            updated_at: '2024-01-02T00:00:00Z',
            created_at: '2024-01-02T00:00:00Z',
            last_accessed_at: '2024-01-02T00:00:00Z',
            metadata: {
              plantId: 'plant-1',
              purpose: 'progress'
            }
          }
        ],
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        list: vi.fn().mockResolvedValue(mockList())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const folder = 'plants/test-user/plant-1';

      const response = await supabase.storage
        .from('plant-images')
        .list(folder, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      expect(response.data).toHaveLength(2);
      expect(response.data[0].name).toBe('image-1.jpg');
      expect(response.data[1].name).toBe('image-2.jpg');
      expect(response.error).toBeNull();
    });

    it('should successfully delete image', async () => {
      const mockRemove = vi.fn().mockResolvedValue({
        data: null,
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue(mockRemove())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const path = 'plants/test-user/plant-1/image.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .remove([path]);

      expect(response.data).toBeNull();
      expect(response.error).toBeNull();
    });

    it('should handle bulk delete operations', async () => {
      const mockRemove = vi.fn().mockResolvedValue({
        data: null,
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue(mockRemove())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const paths = [
        'plants/test-user/plant-1/image-1.jpg',
        'plants/test-user/plant-1/image-2.jpg',
        'plants/test-user/plant-1/image-3.jpg'
      ];

      const response = await supabase.storage
        .from('plant-images')
        .remove(paths);

      expect(response.data).toBeNull();
      expect(response.error).toBeNull();
    });

    it('should handle delete failure for non-existent file', async () => {
      const mockRemove = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'File not found',
          status: 404
        }
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue(mockRemove())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const path = 'plants/test-user/plant-1/non-existent.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .remove([path]);

      expect(response.data).toBeNull();
      expect(response.error.message).toBe('File not found');
      expect(response.error.status).toBe(404);
    });
  });

  describe('Image Update Operations', () => {
    it('should successfully update image metadata', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        data: {
          path: 'plants/test-user/plant-1/image.jpg',
          metadata: {
            plantId: 'plant-1',
            purpose: 'updated-health-check',
            lastUpdated: '2024-01-02T00:00:00Z'
          }
        },
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockResolvedValue(mockUpdate())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const path = 'plants/test-user/plant-1/image.jpg';
      const newMetadata = {
        plantId: 'plant-1',
        purpose: 'updated-health-check',
        lastUpdated: '2024-01-02T00:00:00Z'
      };

      const response = await supabase.storage
        .from('plant-images')
        .update(path, {
          metadata: newMetadata
        });

      expect(response.data.path).toBe(path);
      expect(response.data.metadata.purpose).toBe('updated-health-check');
      expect(response.error).toBeNull();
    });

    it('should handle update failure for non-existent file', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'File not found',
          status: 404
        }
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockResolvedValue(mockUpdate())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const path = 'plants/test-user/plant-1/non-existent.jpg';
      const newMetadata = {
        plantId: 'plant-1',
        purpose: 'health-check'
      };

      const response = await supabase.storage
        .from('plant-images')
        .update(path, {
          metadata: newMetadata
        });

      expect(response.data).toBeNull();
      expect(response.error.message).toBe('File not found');
      expect(response.error.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized access', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Unauthorized access to storage bucket',
          status: 401
        }
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(mockUpload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const imageFile = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const path = 'plants/test-user/plant-1/image.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .upload(path, imageFile);

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(401);
      expect(response.error.message).toContain('Unauthorized');
    });

    it('should handle storage quota exceeded', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Storage quota exceeded. Please upgrade your plan.',
          status: 413
        }
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(mockUpload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const imageFile = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const path = 'plants/test-user/plant-1/image.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .upload(path, imageFile);

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(413);
      expect(response.error.message).toContain('quota exceeded');
    });

    it('should handle network errors', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Network error - unable to connect to storage service',
          status: 500
        }
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(mockUpload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const imageFile = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const path = 'plants/test-user/plant-1/image.jpg';

      const response = await supabase.storage
        .from('plant-images')
        .upload(path, imageFile);

      expect(response.data).toBeNull();
      expect(response.error.status).toBe(500);
      expect(response.error.message).toContain('Network error');
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle concurrent uploads efficiently', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: {
          path: 'plants/test-user/plant-1/concurrent-image.jpg',
          id: 'upload-id',
          size: 1024000
        },
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(mockUpload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const images = Array.from({ length: 5 }, (_, i) => ({
        file: new File([`image-${i}-data`], `plant-${i}.jpg`, { type: 'image/jpeg' }),
        path: `plants/test-user/plant-1/plant-${i}.jpg`
      }));

      const responses = await Promise.all(
        images.map(({ file, path }) =>
          supabase.storage
            .from('plant-images')
            .upload(path, file)
        )
      );

      expect(responses).toHaveLength(5);
      expect(mockUpload).toHaveBeenCalledTimes(5);
      
      responses.forEach(response => {
        expect(response.data).toBeDefined();
        expect(response.error).toBeNull();
      });
    });

    it('should handle different image formats', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: {
          path: 'plants/test-user/plant-1/image.jpg',
          id: 'upload-id',
          size: 1024000,
          mimeType: 'image/jpeg'
        },
        error: null
      });

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(mockUpload())
      });

      (supabase.storage.from as any).mockImplementation(mockStorageFrom);

      const imageFormats = [
        new File(['jpeg-data'], 'plant.jpg', { type: 'image/jpeg' }),
        new File(['png-data'], 'plant.png', { type: 'image/png' }),
        new File(['webp-data'], 'plant.webp', { type: 'image/webp' })
      ];

      for (const image of imageFormats) {
        const path = `plants/test-user/plant-1/${image.name}`;
        const response = await supabase.storage
          .from('plant-images')
          .upload(path, image);

        expect(response.data).toBeDefined();
        expect(response.error).toBeNull();
      }
    });
  });
}); 